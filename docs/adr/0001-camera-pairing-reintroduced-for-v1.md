# Camera pairing reintroduced for V1; device hardware stays audio-only

`STEP 05` removed cameras from the MVP because *integrated* camera hardware raised BOM from ~€18 to €95+ and created indoor privacy (GDPR) problems. We are reintroducing cameras for V1 — but only as an **optional network pairing with cameras the customer already owns** (ONVIF: Hikvision, Dahua, Reolink, …). The Device hardware is final: **ESP32-S3 + microphone only**, no camera, relay, siren, or speaker in the box.

This dissolves the original objections (no camera BOM cost on our side; the customer already accepted the privacy posture of their own cameras) while unlocking recording triggers and siren activation through the Paired Camera's own hardware. Venues that already run cameras (bars, construction sites, yards) become a target segment alongside the original privacy-first indoor market, which keeps working unchanged in Audio-Only Mode.

## Consequences

- `STEP 05 — CAMERA_SYSTEM.md` is superseded: cameras return, but never as device hardware — only as Paired Cameras.
- `STEP 06 — AI_ENGINE.md` (AI classification deferred) is back under discussion in the ongoing grilling session.
- Every camera-dependent feature (recording trigger, siren) must be deliverable through the Paired Camera's network API or degrade gracefully to Audio-Only behaviour.
