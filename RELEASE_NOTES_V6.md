BoilerPro SA v6.0.0
==================

Major upgrade from v5.

- Timed 20-question mock trade test (30 minutes)
- Practical trade-test simulation and rubric scoring
- Server-side practical attempt history
- Readiness assessment retained and expanded
- BoilerPro Tutor: guided mode plus optional server-side OpenAI Responses API integration
- Android WorkManager dependency updated to 2.12.0
- Android versionCode 6 / versionName 6.0.0
- Existing admin, learner, offline lessons and sync features preserved
- Welding and engineering drawing remain excluded
- 56° square-main/round-branch lesson remains excluded

## v6 Data Mode update
- Changed learner Android experience from offline-first to online/data-first.
- Added Android connectivity monitoring and visible Online/Data Mode status.
- Mobile/cellular data is supported alongside Wi-Fi.
- Live server lessons are loaded after authentication.
- Removed offline-cache messaging from the learner UI.
- Added ACCESS_NETWORK_STATE permission.
- Kept legacy Room/WorkManager source only for migration compatibility; it is not the primary learner path.
