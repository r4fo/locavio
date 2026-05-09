import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from app.services.linkedin_auth_service import exchange_code_for_token, get_linkedin_user


def _make_response(json_data, status_code=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_data
    return mock_resp


@pytest.mark.asyncio
async def test_exchange_code_for_token_success():
    mock_resp = _make_response({"access_token": "li-token-123"}, 200)

    with patch("httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await exchange_code_for_token("auth-code-abc", "https://locavio-beta.vercel.app/auth/linkedin/callback")

    assert result == "li-token-123"
    mock_client.post.assert_awaited_once()
    assert mock_client.post.await_args.kwargs["data"]["redirect_uri"] == "https://locavio-beta.vercel.app/auth/linkedin/callback"


@pytest.mark.asyncio
async def test_exchange_code_for_token_failure_raises_401():
    mock_resp = _make_response({"error": "invalid_grant"}, 400)

    with patch("httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(HTTPException) as exc_info:
            await exchange_code_for_token("bad-code", "https://locavio-beta.vercel.app/auth/linkedin/callback")

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_linkedin_user_success():
    user_data = {
        "email": "user@linkedin.com",
        "name": "LinkedIn User",
        "picture": "https://example.com/pic.jpg",
    }
    mock_resp = _make_response(user_data, 200)

    with patch("httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await get_linkedin_user("li-token-123")

    assert result["email"] == "user@linkedin.com"
    assert result["name"] == "LinkedIn User"
    assert result["avatar_url"] == "https://example.com/pic.jpg"


@pytest.mark.asyncio
async def test_get_linkedin_user_api_failure_raises_401():
    mock_resp = _make_response({"error": "unauthorized"}, 401)

    with patch("httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(HTTPException) as exc_info:
            await get_linkedin_user("bad-token")

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_linkedin_user_no_email_raises_400():
    mock_resp = _make_response({"name": "No Email User", "picture": ""}, 200)

    with patch("httpx.AsyncClient") as MockClient:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClient.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(HTTPException) as exc_info:
            await get_linkedin_user("token-without-email")

    assert exc_info.value.status_code == 400
