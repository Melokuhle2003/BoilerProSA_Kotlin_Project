# BoilerPro SA v4 Release Notes

## v4 — Learner + Admin Production Platform

### Added
- Learner registration and login.
- Server-side lesson progress.
- Server-side question attempts and answer checking.
- Random mock-test generation.
- Server-side mock-test scoring and history.
- Readiness Assessment API and learner dashboard.
- Admin/Instructor learner progress view.
- Same-origin learner web app at `/`.
- HttpOnly refresh-cookie support for the learner web authentication flow.
- v4 PostgreSQL migration `003_v4_learner_progress.sql`.

### Preserved
- Server-side Admin Portal from v3.
- Lesson and practice-question management.
- Audit logging.
- Existing 90° cone and 60° PVW 2-3 fabrication lessons.
- Custom mean-diameter, inside-size and bend-line training principles.

### Excluded
- 56° square-main/round-branch lesson.
- Welding and welding theory.
- Engineering Drawing.

### Important status
This is a deployable software package, not a live hosted production service. A production domain, TLS, PostgreSQL instance, secrets, backups, monitoring and deployment are still required.
