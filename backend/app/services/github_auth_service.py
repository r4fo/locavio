"""GitHub OAuth service — follows the same pattern as linkedin_auth_service."""

import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("locavio")


def _redirect_uri(redirect_uri: str | None = None) -> str:
    return redirect_uri or f"{settings.FRONTEND_URL}/auth/github/callback"


async def exchange_code_for_token(code: str, redirect_uri: str | None = None) -> str:
    """Exchange a GitHub authorization code for an access token."""
    redirect_uri = _redirect_uri(redirect_uri)
    logger.info("[GitHub] Starting token exchange — code_prefix=%s redirect_uri=%s", code[:8], redirect_uri)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        logger.info("[GitHub] Token exchange response: status=%s", resp.status_code)

        if resp.status_code != 200:
            try:
                error_body = resp.json()
            except Exception:
                error_body = resp.text
            logger.error("[GitHub] Token exchange FAILED: status=%s body=%s", resp.status_code, error_body)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"GitHub token exchange failed ({resp.status_code}): {error_body}",
            )

        token_data = resp.json()

    if "error" in token_data:
        logger.error("[GitHub] Token exchange returned error: %s", token_data)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"GitHub token exchange error: {token_data.get('error_description', token_data['error'])}",
        )

    logger.info("[GitHub] Token exchange successful")
    return token_data["access_token"]


async def get_github_user(access_token: str) -> dict:
    """Fetch user profile from GitHub's API, handling private email accounts."""
    logger.info("[GitHub] Fetching user profile")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        logger.info("[GitHub] User profile response: status=%s", resp.status_code)

        if resp.status_code != 200:
            try:
                error_body = resp.json()
            except Exception:
                error_body = resp.text
            logger.error("[GitHub] User fetch FAILED: status=%s body=%s", resp.status_code, error_body)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to fetch GitHub user info ({resp.status_code}): {error_body}",
            )

        data = resp.json()
        email = data.get("email")

        # GitHub users can have private emails — fetch from the emails endpoint
        if not email:
            email_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            if email_resp.status_code == 200:
                emails = email_resp.json()
                primary = next(
                    (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                    None,
                )
                email = primary

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "GitHub did not return an email address. "
                "Please ensure your GitHub account has a verified public or primary email."
            ),
        )

    name = data.get("name") or data.get("login", "")
    avatar_url = data.get("avatar_url", "")
    logger.info("[GitHub] User info received — email=%s name=%s", email, name)

    return {"email": email, "name": name, "avatar_url": avatar_url}
