# BoilerPro SA v6 — Trade-Test Simulator Release

## Added
- Native Android v6 learner experience.
- 30-minute, 20-question timed Mock Trade Test.
- Server-side mock scoring; 80% is a BoilerPro training pass indicator only.
- Practical simulation scenarios for the 90° cone/off-set intersection pipe and 60° round/off-set square exercise.
- Practical checklist/rubric and server-side practical attempt history.
- Readiness assessment and dashboard integration.
- BoilerPro Tutor endpoint with a guided fabrication knowledge mode.
- Optional server-side OpenAI Responses API tutor provider, enabled only when `TUTOR_PROVIDER=openai` and `OPENAI_API_KEY` are configured. The API key stays on the server; it is never placed in the Android app.
- Tutor scope explicitly excludes welding and engineering drawing.
- Existing v3 admin and v4 learner APIs preserved.

## Training-content rule
User-supplied mean-diameter, bending-machine inside-size and bend-line principles remain custom training principles. Verify every practical job against its drawing, specification, approved procedure and assessor requirements.

## Production checklist
1. Run database migrations.
2. Seed v6 practical scenarios.
3. Configure HTTPS and production environment variables.
4. If using the optional AI tutor, configure `OPENAI_API_KEY` server-side.
5. Build and test the Android app against the production API.
6. Perform security, accessibility and trade-content review before public release.
