# BoilerPro SA v6 — Online/Data Mode Change

## Product decision
v6 is now **ONLINE/DATA MODE** rather than offline-first. Learner content and assessments are loaded from the live server.

### Supported connections
- Mobile/cellular data
- Wi-Fi
- Any validated internet connection supported by Android

### Server is authoritative
The server remains authoritative for:
- authentication and roles
- published lessons and images
- practice questions
- mock tests and scores
- practical scenarios and assessments
- learner progress
- readiness calculations
- tutor responses

### Offline behavior
The learner UI does not substitute cached lessons when disconnected. It tells the learner to connect to mobile data or Wi-Fi. Legacy Room/WorkManager source is retained only to make the v5-to-v6 migration easier; it is not used as the v6 primary learning path.

### Data usage
Because v6 uses mobile data directly, large media should be optimized and server responses should remain compact. Android can expose whether a network is metered, so future releases can offer a user-controlled data saver without changing the online-first architecture.

### Demo/free access
A free demonstration should be implemented as a server-side demo account or demo environment. Authentication should not be bypassed in a production build.
