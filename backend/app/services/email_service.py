import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("locavio")

def _send_email_sync(to_email: str, subject: str, body: str) -> None:
    """Synchronous function to send an email using SMTP."""
    
    # You need to define these in your ...env file or config!
    smtp_server = getattr(settings, "SMTP_SERVER", "smtp.gmail.com")
    smtp_port = getattr(settings, "SMTP_PORT", 587)
    smtp_username = getattr(settings, "SMTP_USERNAME", None)
    smtp_password = getattr(settings, "SMTP_PASSWORD", None)

    if not smtp_username or not smtp_password:
        logger.warning(f"Email credentials missing. Skipping email to {to_email}")
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = smtp_username
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Successfully sent email to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

async def send_2fa_code(email: str, code: str) -> None:
    """Asynchronously send the 2FA code to the user."""
    subject = "Your Locavio 2FA Code"
    body = f"Hello,\n\nYour 2-Factor Authentication code is: {code}\n\nThis code will expire in 5 minutes.\n\nThanks,\nThe Locavio Team"
    
    # Run the synchronous email sending in a background thread to avoid blocking FastAPI
    await asyncio.to_thread(_send_email_sync, email, subject, body)
