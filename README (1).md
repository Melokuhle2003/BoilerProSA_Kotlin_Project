# BoilerPro SA v4 — Learner + Admin Production Platform

**Tagline:** Prepare. Practise. Pass.

v4 is the next logical release after the server-side Admin Portal. It connects the learner application to the server so learner accounts, lesson progress, question attempts, mock-test scores and readiness indicators are stored in PostgreSQL.

## v4 features

- Learner registration and sign-in.
- Server-side learner profiles with the LEARNER role only for public registration.
- Published lessons retrieved from the API.
- Lesson progress stored in PostgreSQL.
- Practice questions retrieved without exposing the correct answer.
- Server-side answer checking and question-attempt history.
- Random server-generated mock tests and server-side scoring.
- Mock-test history.
- Readiness Assessment based on lesson progress, quiz accuracy and mock-test performance.
- Admin/Instructor learner-progress dashboard.
- Existing v3 lesson/question administration retained.
- Same-origin learner web application served at `/` and admin portal at `/admin/`.
- Refresh token cookie support for the learner web flow; the refresh cookie is HttpOnly and Secure in production.
- Existing fabrication lessons preserved: Cone with Off-Set Intersection Pipe (90°) and Round Pipe with Off-Set Square Pipe (60°) PVW 2-3.
- The 56° square-main/round-branch lesson is excluded.
- Welding and engineering drawing remain excluded from BoilerPro SA.

## Run locally

1. Create PostgreSQL and configure `server/.env`.
2. Install and build:

```bash
cd server
npm install
npm run build
npm run db:migrate
npm run db:seed-admin
npm run db:seed-lessons
npm run db:seed-questions
npm start
```

3. Open the learner app at `/`.
4. Open the staff portal at `/admin/`.

### Admin seed

Set environment variables before `npm run db:seed-admin`:

```text
ADMIN_EMAIL=your-admin-email
ADMIN_NAME=your-admin-name
ADMIN_PASSWORD=your-long-unique-passphrase
```

Do not put a real password in source code or send it through chat.

## Readiness formula

The v4 training indicator combines:

- 40% lesson progress
- 30% practice-question accuracy
- 30% average mock-test score

Bands:

- 85–100: TRADE-TEST READY indicator
- 70–84: NEARLY READY
- 50–69: BUILDING SKILL
- 0–49: STARTING OUT

These are **BoilerPro training indicators**, not an official QCTO/merSETA trade-test result.

## Security notes

The learner refresh token is kept in an HttpOnly cookie by the web flow rather than browser localStorage. Access-control decisions remain server-side. Use HTTPS/TLS in production, strong secrets, private PostgreSQL networking, backups, monitoring, image scanning and a formal POPIA compliance review before public launch.

OWASP guidance recommends strong password hashing such as Argon2id, server-side authorization, secure session handling and HTTPS for authenticated sessions.
