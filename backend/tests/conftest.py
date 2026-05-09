import os

# Patch settings BEFORE importing app — must be done before any app imports
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("LINKEDIN_CLIENT_ID", "test-linkedin-client-id")
os.environ.setdefault("LINKEDIN_CLIENT_SECRET", "test-linkedin-secret")

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event, Enum as SAEnum
from sqlalchemy.orm import selectinload

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

# We must import Base BEFORE creating the engine so metadata is populated.
# Importing app.main triggers all model imports which register tables.
from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.models.user import User, AuthProvider, UserRole
from app.models.itinerary import Itinerary
from app.models.activity import Activity

# Patch all Enum columns to use non-native enums so SQLite can handle them.
# SQLAlchemy renders native=False Enums as VARCHAR in SQLite, which works fine.
for table in Base.metadata.tables.values():
    for column in table.columns:
        if isinstance(column.type, SAEnum):
            column.type.native_enum = False
            column.type.create_constraint = False

engine = create_async_engine(TEST_DB_URL, echo=False)


class EagerLoadingSession(AsyncSession):
    """AsyncSession subclass that eager-loads known relationships on refresh.

    This prevents MissingGreenlet errors when FastAPI serializes ORM objects
    that have lazy-loaded relationships (e.g. Itinerary.activities).
    """

    async def refresh(self, instance, attribute_names=None, with_for_update=None):
        # Determine extra eager-load options based on instance type
        options = []
        if isinstance(instance, Itinerary):
            options = [selectinload(Itinerary.activities)]
        await super().refresh(
            instance,
            attribute_names=attribute_names,
            with_for_update=with_for_update,
        )
        if options:
            # Re-execute a select to eager-load the relationships
            from sqlalchemy.future import select
            result = await self.execute(
                select(type(instance))
                .where(type(instance).id == instance.id)
                .options(*options)
            )
            refreshed = result.scalar_one_or_none()
            if refreshed is not None:
                # Copy the loaded relationship data back to the original instance
                instance.__dict__.update(
                    {k: v for k, v in refreshed.__dict__.items() if k.startswith("activities")}
                )


TestSessionLocal = async_sessionmaker(
    engine,
    class_=EagerLoadingSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def reset_rate_limiter():
    from app.core.limiter import limiter
    limiter._storage.reset()
    yield


@pytest_asyncio.fixture
async def test_db():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_client(test_db):
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def mock_user(test_db):
    import uuid
    unique_email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        name="Test User",
        auth_provider=AuthProvider.email,
        password_hash="hashed",
        role=UserRole.user,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    yield user
    try:
        await test_db.delete(user)
        await test_db.commit()
    except Exception:
        await test_db.rollback()


@pytest.fixture
def auth_headers(mock_user):
    token = create_access_token({"sub": str(mock_user.id)})
    token = create_access_token({"sub": str(mock_user.id), "role": "user"})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def mock_admin(test_db):
    import uuid
    unique_email = f"admin-{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=unique_email,
        name="Admin User",
        auth_provider=AuthProvider.email,
        password_hash="hashed",
        role=UserRole.admin,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    yield user
    try:
        await test_db.delete(user)
        await test_db.commit()
    except Exception:
        await test_db.rollback()


@pytest.fixture
def admin_headers(mock_admin):
    token = create_access_token({"sub": str(mock_admin.id)})
    token = create_access_token({"sub": str(mock_admin.id), "role": "admin"})
    return {"Authorization": f"Bearer {token}"}