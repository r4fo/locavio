import pytest
import uuid
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(test_client):
    email = f"dup2-{uuid.uuid4().hex[:8]}@test.com"
    await test_client.post("/api/v1/auth/register", json={
        "email": email, "password": "pass", "name": "A"
    })
    resp = await test_client.post("/api/v1/auth/register", json={
        "email": email, "password": "pass2", "name": "B"
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_nonexistent_user_returns_401(test_client):
    resp = await test_client.post("/api/v1/auth/login", json={
        "email": "nobody-xyz@test.com", "password": "pass"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_linkedin_url_endpoint_returns_url(test_client):
    resp = await test_client.get(
        "/api/v1/auth/linkedin/url",
        params={"redirect_uri": "https://locavio-beta.vercel.app/auth/linkedin/callback"},
    )
    assert resp.status_code == 200
    assert "url" in resp.json()
    assert "linkedin.com" in resp.json()["url"]
    assert "locavio-beta.vercel.app%2Fauth%2Flinkedin%2Fcallback" in resp.json()["url"]


@pytest.mark.asyncio
async def test_google_auth_with_invalid_token_returns_401(test_client):
    resp = await test_client.post("/api/v1/auth/google", json={"token": "bad-token"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_google_auth_with_valid_token_returns_200(test_client):
    google_data = {
        "email": f"google-{uuid.uuid4().hex[:8]}@example.com",
        "name": "Google User",
        "picture": "",
    }
    with patch(
        "app.routers.auth.verify_google_token",
        new=AsyncMock(return_value=google_data),
    ):
        resp = await test_client.post("/api/v1/auth/google", json={"token": "valid-mock-token"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_linkedin_auth_with_valid_code_returns_200(test_client):
    linkedin_data = {
        "email": f"li-{uuid.uuid4().hex[:8]}@example.com",
        "name": "LinkedIn User",
        "avatar_url": "",
    }
    with patch(
        "app.routers.auth.linkedin_auth_service.exchange_code_for_token",
        new=AsyncMock(return_value="mock-access-token"),
    ), patch(
        "app.routers.auth.linkedin_auth_service.get_linkedin_user",
        new=AsyncMock(return_value=linkedin_data),
    ):
        resp = await test_client.post(
            "/api/v1/auth/linkedin",
            json={
                "code": "valid-code",
                "redirect_uri": "https://locavio-beta.vercel.app/auth/linkedin/callback",
            },
        )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_github_url_endpoint_returns_url(test_client):
    resp = await test_client.get(
        "/api/v1/auth/github/url",
        params={"redirect_uri": "https://locavio-beta.vercel.app/auth/github/callback"},
    )
    assert resp.status_code == 200
    assert "url" in resp.json()
    assert "github.com" in resp.json()["url"]
    assert "locavio-beta.vercel.app%2Fauth%2Fgithub%2Fcallback" in resp.json()["url"]


@pytest.mark.asyncio
async def test_github_auth_with_valid_code_returns_200(test_client):
    github_data = {
        "email": f"gh-{uuid.uuid4().hex[:8]}@example.com",
        "name": "GitHub User",
        "avatar_url": "https://avatars.githubusercontent.com/u/1",
    }
    with patch(
        "app.routers.auth.github_auth_service.exchange_code_for_token",
        new=AsyncMock(return_value="mock-gh-token"),
    ), patch(
        "app.routers.auth.github_auth_service.get_github_user",
        new=AsyncMock(return_value=github_data),
    ):
        resp = await test_client.post(
            "/api/v1/auth/github",
            json={
                "code": "valid-gh-code",
                "redirect_uri": "https://locavio-beta.vercel.app/auth/github/callback",
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["auth_provider"] == "github"


@pytest.mark.asyncio
async def test_github_auth_with_bad_code_returns_401(test_client):
    from fastapi import HTTPException, status as http_status
    with patch(
        "app.routers.auth.github_auth_service.exchange_code_for_token",
        new=AsyncMock(side_effect=HTTPException(status_code=http_status.HTTP_401_UNAUTHORIZED, detail="bad code")),
    ):
        resp = await test_client.post(
            "/api/v1/auth/github",
            json={
                "code": "bad-code",
                "redirect_uri": "https://locavio-beta.vercel.app/auth/github/callback",
            },
        )
    assert resp.status_code == 401
