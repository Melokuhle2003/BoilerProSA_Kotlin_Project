# BoilerPro SA Kotlin Android Studio Project

## Included
- Native Android Kotlin + Jetpack Compose project skeleton
- Online/Data Mode status panel
- Server lesson fetch via Retrofit
- Learner dashboard and navigation
- Login UI placeholder
- Practice, progress, tutor integration screens
- Steel Profiles screen with back-mark/cross-centre poster
- 90° cone and 60° PVW 2-3 fallback lesson cards

## Open the project
1. Extract this ZIP.
2. Open the root folder `BoilerProSA_Kotlin_Project` in Android Studio.
3. Allow Gradle sync; install Android SDK 35 and JDK 17 if prompted.
4. Open `app/src/main/java/za/co/boilerpro/sa/data/ApiClient.kt`.
5. Replace `https://YOUR_API_DOMAIN/` with the real deployed HTTPS API URL.
6. Confirm `GET /api/lessons` and its JSON response match `Lesson`.
7. Run on an Android device/emulator with internet access.

## Important status
This is starter source code, not a signed APK or a fully integrated production client. The login UI is a placeholder; authentication, question submission, mock tests, progress and tutor must be connected to the exact routes and request/response schemas of the deployed v6 backend. No live server has been provisioned here.

## Scope
Included custom training lessons: Cone with Off-Set Intersection Pipe (90°), Round Pipe with Off-Set Square Pipe (60° PVW 2-3), mean diameter × π, bending-machine inside-size guidance, and equally divided 360° bend-line calculation.
Excluded: 56° square-main/round-branch lesson, welding, welding theory, engineering drawing.

The supplied steel-profile poster is a training reference only; verify dimensions against actual profile tables and job drawings before workshop use.
