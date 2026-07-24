# AI sound classification runs on-device; raw audio never leaves the Device

V1 includes AI sound classification, which `STEP 06` had deferred. We decided the classifier runs **on the Device (ESP32-S3, small quantised model)**, not in the cloud — even though cloud models (YAMNet-class) are more accurate. The reason is the privacy boundary from `STEP 00`: raw audio never leaves the device. Cloud classification would require streaming audio clips and would break the brand promise that makes the product sellable for indoor/residential use.

Only dBA levels and a classification **label** are transmitted as event metadata. Classification enriches Noise Events; it never suppresses or replaces dBA threshold alerting (per `STEP 06`'s design principle). Scope cap: at most 5 sound classes in V1.

## Consequences

- Model must fit ESP32-S3 constraints (8 MB flash, 2 MB PSRAM, TFLite Micro).
- This is the biggest technical risk in V1 — if dataset/training slips, the feature moves to V1.1 without blocking the rest of the release.
- Any future feature requiring raw audio off-device must reopen this ADR explicitly.
