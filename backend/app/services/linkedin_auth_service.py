import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("locavio")


def _redirect_uri(redirect_uri: str | None = None) -> str:
    return redirect_uri or f"{settings.FRONTEND_URL}/auth/linkedin/callback"


async def exchange_code_for_token(code: str, redirect_uri: str | None = None) -> str:
    """Exchange a LinkedIn authorization code for an access token."""
    redirect_uri = _redirect_uri(redirect_uri)
    logger.info("[LinkedIn] Starting token exchange — code_prefix=%s redirect_uri=%s", code[:8], redirect_uri)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
        )
        logger.info("[LinkedIn] Token exchange response: status=%s", resp.status_code)

        if resp.status_code != 200:
            try:
                error_body = resp.json()
            except Exception:
                error_body = resp.text
            logger.error("[LinkedIn] Token exchange FAILED: status=%s body=%s", resp.status_code, error_body)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"LinkedIn token exchange failed ({resp.status_code}): {error_body}",
            )

        token_data = resp.json()

    logger.info("[LinkedIn] Token exchange successful")
    return token_data["access_token"]


async def get_linkedin_user(access_token: str) -> dict:
    """Fetch user profile from LinkedIn's OpenID Connect userinfo endpoint."""
    logger.info("[LinkedIn] Fetching userinfo from OpenID Connect endpoint")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        logger.info("[LinkedIn] Userinfo response: status=%s", resp.status_code)

        if resp.status_code != 200:
            try:
                error_body = resp.json()
            except Exception:
                error_body = resp.text
            logger.error("[LinkedIn] Userinfo fetch FAILED: status=%s body=%s", resp.status_code, error_body)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to fetch LinkedIn user info ({resp.status_code}): {error_body}",
            )

        data = resp.json()

    email = data.get("email")
    name = data.get("name", "")
    logger.info("[LinkedIn] Userinfo received — email=%s name=%s", email, name)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "LinkedIn did not return an email address. "
                "Please ensure your LinkedIn account has a verified email."
            ),
        )

    return {
        "email": email,
        "name": name,
        "avatar_url": data.get("picture", ""),
    }
