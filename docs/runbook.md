# Production Runbook

## Required environment variables
- `AUTH_SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `ADMIN_EMAIL`
- `GLS_API_BASE_URL`, `GLS_API_KEY`
- `POSTA_API_BASE_URL`, `POSTA_API_KEY`
- `BILLINGO_API_KEY`, `BILLINGO_API_BASE_URL` (optional, defaults to v3 endpoint)

## Health checks
- API: `GET /api/health`
- Verify Stripe webhook delivery status in Stripe dashboard

## Release checklist
1. Rotate API keys before production rollout.
2. Run migration/deploy pipeline and smoke tests.
3. Verify admin login and role-protected endpoints.
4. Place test order with card payment and webhook callback.
5. Confirm shipping and invoice integrations return live IDs.

## Backup / restore
- Persist and back up `data/*.json` daily until full DB migration is completed.
- Keep an encrypted offsite copy of backups and restore test monthly.

