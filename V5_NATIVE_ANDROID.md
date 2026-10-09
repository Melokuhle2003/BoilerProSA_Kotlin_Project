# BoilerPro SA v5 — Native Android Production Direction

v5 introduces a native Android learner client while preserving the v4 Node.js/PostgreSQL server and web admin portal.

## Architecture
UI -> ViewModel/Repository -> Room local database + Retrofit network -> v4 server.
WorkManager performs periodic sync when connectivity is available. Android's offline-first guidance recommends local data as a usable source and persistent work for later synchronisation. See Android Developers: https://developer.android.com/topic/architecture/data-layer/offline-first

## Security
- Access/refresh session values are encrypted on-device.
- Server remains the authority for authentication, permissions, scoring and published content.
- API endpoint must be HTTPS in production.
- No secrets are shipped in the app.

## Notifications
v5 includes a local study reminder. Production push notifications can be added later with FCM after a server-side notification service and consent/preferences are configured.

## Current trade-test scope
Preserved: boilermaking theory, fabrication, measuring/marking, calculations, cutting/forming, tools/materials, safety, inspection/quality, practical preparation, mock tests, AI tutor planning and readiness.
Excluded: welding, welding theory/simulator/questions/practical exercises, and engineering drawing.
