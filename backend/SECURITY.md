# Locavio Security

## Implemented measures
- CORS locked to frontend domain only
- Rate limiting: 5 requests/minute on all auth endpoints
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, XSS-Protection
- JWT signed with validated strong secret key (32+ chars enforced on startup)
- Passwords hashed with bcrypt
- OAuth tokens verified server-side (Google, LinkedIn)
- SQL injection prevented by SQLAlchemy ORM parameterized queries
- Supabase PostgreSQL with SSL enforced
- Input sanitized before rendering in React components
- JWT stored in sessionStorage (not localStorage) to reduce XSS attack surface
- Role-based access control: guest / user / admin with server-side enforcement

## How to verify
- Security headers: curl -I https://your-api-domain.railway.app
- Rate limiting: send 6 POST /auth/google requests in 1 minute → 429 response
- CORS: browser DevTools → Network → check response headers on any API call
- SSL: Supabase dashboard → Database → SSL enforced ✓
