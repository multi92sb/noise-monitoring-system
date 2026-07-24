# 03 — Sound Class end-to-end (baseline model)

**What to build:** An offline Python training pipeline produces a baseline on-device model for `crate_banging | talking | car_engine_starting | unknown`; the firmware classifier (TFLite Micro, mel-spectrogram features) attaches the Sound Class to every Noise Event payload; the backend stores it; the dashboard and alerts display it. The label is metadata and never gates alerting (ADR-0002).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Offline pipeline yields a versioned TFLite Micro model blob compiled into firmware, with a metrics report on a held-out set
- [ ] Every Noise Event carries `soundClass` (`unknown` allowed); alerting fires identically regardless of class
- [ ] Classifier verified against golden samples in host-side firmware tests (fixed feature inputs → expected Sound Class)
- [ ] Dashboard event list, alert content, and evidence view display the label (Vitest)
- [ ] No raw audio leaves the Device at any point
