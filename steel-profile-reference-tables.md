# BoilerPro SA v6 — Steel Profile Reference Tables

Added topics:
- Channel (C-section) back-mark table
- Equal and unequal angle iron back-mark table
- I-beam and H-beam cross-centre table
- Worked example for equally spaced hole centres, as shown in the supplied poster

## Displaying this in the Android app
The supplied poster is stored at:
`app/src/main/res/drawable-nodpi/boilermaking_reference_tables.png`

A Jetpack Compose screen has been added at:
`app/src/main/java/za/co/boilerpro/sa/ui/SteelProfileReferenceScreen.kt`

To show it in the app, add a navigation/menu entry labelled **Steel Profiles** and call `SteelProfileReferenceScreen()` from that route.

## Accuracy and safe use
The table values are transcribed from the user's supplied image and have not been independently verified. The image itself says the values are typical training references and can vary by section size, drawing and specification. Verify against the actual steel section tables, drawing and instructor/supervisor before workshop use.
