# 06 — Hikvision Siren + on-device rules engine

**What to build:** A venue owner configures Siren rules in the dashboard (minimum level, active hours, max duration, cooldown). Rules sync to the Device, which fires the paired Hikvision camera's siren/strobe via ISAPI on qualifying Noise Events and enforces max duration and cooldown entirely offline. Every activation/deactivation is logged on the Noise Event.

**Blocked by:** 02 — Camera pairing end-to-end.

**Status:** ready-for-agent

- [ ] Siren rules CRUD in the dashboard, synced via the device-config channel (pytest + Vitest)
- [ ] Rules engine is pure on-device logic: given event + clock + config → fire / expire / cooldown (host-side unit tests)
- [ ] Siren fires via ISAPI, deactivates at max duration, respects cooldown, and works with no internet connectivity
- [ ] Every Siren action logged on the Noise Event; failures surface in camera health
- [ ] Manual protocol (extends STEP 14): real Hikvision siren fires within 5 s of event start and cuts off at max duration
