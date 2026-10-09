# BoilerPro SA Learner Web MVP

This is the learner-facing browser MVP retained inside the v3 release. It contains the existing fabrication lessons and practice flow and can be opened locally as a static web app.

For production, connect the learner experience to the v3 server APIs under `/api/lessons` and `/api/lessons/:id/questions` so published content comes from the server rather than browser-local data.

## v6 Data Mode
The intended v6 learner experience is online/data mode: connect to the live HTTPS API using Wi-Fi or mobile data. The server is the source of truth for published content, attempts, scores and readiness.
