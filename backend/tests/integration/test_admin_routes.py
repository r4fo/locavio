import pytest


@pytest.mark.asyncio
async def test_list_users_without_auth_returns_401(test_client):
    resp = await test_client.get("/api/v1/admin/users")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_users_as_regular_user_returns_403(test_client, auth_headers):
    resp = await test_client.get("/api/v1/admin/users", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_users_as_admin_returns_200(test_client, admin_headers, mock_admin):
    resp = await test_client.get("/api/v1/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_stats_as_admin_returns_200(test_client, admin_headers):
    resp = await test_client.get("/api/v1/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    for key in ("total_users", "total_itineraries", "new_users_this_week"):
        assert key in data


@pytest.mark.asyncio
async def test_change_user_role_as_admin_returns_200(test_client, admin_headers, mock_user):
    resp = await test_client.patch(
        f"/api/v1/admin/users/{mock_user.id}",
        headers=admin_headers,
        json={"role": "admin"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_change_own_role_returns_400(test_client, admin_headers, mock_admin):
    resp = await test_client.patch(
        f"/api/v1/admin/users/{mock_admin.id}",
        headers=admin_headers,
        json={"role": "user"},
    )
    assert resp.status_code == 400
    assert "own" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_delete_user_as_admin_returns_204(test_client, admin_headers, test_db):
    import uuid
    from app.models.user import User, AuthProvider, UserRole
    # Create a throwaway user to delete
    target = User(
        email=f"delete-me-{uuid.uuid4().hex[:8]}@example.com",
        name="Delete Me",
        auth_provider=AuthProvider.email,
        role=UserRole.user,
    )
    test_db.add(target)
    await test_db.commit()
    await test_db.refresh(target)

    resp = await test_client.delete(f"/api/v1/admin/users/{target.id}", headers=admin_headers)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_own_account_returns_400(test_client, admin_headers, mock_admin):
    resp = await test_client.delete(f"/api/v1/admin/users/{mock_admin.id}", headers=admin_headers)
    assert resp.status_code == 400
    assert "own account" in resp.json()["detail"]