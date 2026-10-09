# BoilerPro SA v5 — Prepare. Practise. Pass.

v5 is the next logical release after v4: the server/admin platform remains the source of truth, while a native Android learner app is added for real mobile use.

### Components
1. Node.js + TypeScript + PostgreSQL server/admin from v4
2. Web learner platform from v4
3. Native Android app (`android-native`)
4. Offline Room cache
5. WorkManager synchronisation
6. Encrypted Android session storage
7. Local study reminder

### Production path
Deploy the v4/v5 server over HTTPS, configure the Android API URL, run database migrations/seeds, build the Android release, test authentication/sync/offline mode, then distribute through the intended channel.
