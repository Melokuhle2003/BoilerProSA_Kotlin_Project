# BoilerPro SA v6 — Online/Data Mode

This Android build is **online-first**. The live BoilerPro SA server is the source of truth for authentication, published lessons, questions, mock tests, practical scenarios, tutor responses, scores and readiness.

## Network behavior
- Works over Wi-Fi and mobile/cellular data.
- Requires a validated internet connection to sign in and use server features.
- No offline lesson fallback is used by the learner UI.
- The old Room/WorkManager files are retained only as compatibility code for the v5 migration; they are not used as the primary learner experience in v6 Data Mode.
- The app displays ONLINE/DATA MODE and the current transport when Android reports it.

Android's ConnectivityManager/NetworkCapabilities APIs are used to detect validated internet access and cellular transport.

## Configure the live API
Edit `app/src/main/java/za/co/boilerprosa/data/ServiceLocator.kt` and replace:
`https://YOUR_API_DOMAIN/`
with the production HTTPS API base URL, including the trailing slash.

Do not put production secrets or an AI provider API key in the Android app. Those remain server-side.

## Demo mode
If a no-payment demonstration is required, configure the server with a dedicated demo account/role or demo environment. Do not bypass authentication in the production build.
