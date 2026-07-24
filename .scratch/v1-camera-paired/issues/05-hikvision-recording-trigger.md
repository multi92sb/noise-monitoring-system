# 05 — Hikvision Recording Trigger

**What to build:** When a Noise Event starts, the Device sends a Recording Trigger (Hikvision ISAPI) to each paired Tier 1 camera and logs the outcome on the event. The trigger path is LAN-only and keeps working with the internet down. Failures mark the camera degraded without affecting measurement or alerting.

**Blocked by:** 02 — Camera pairing end-to-end.

**Status:** ready-for-agent

- [ ] Noise Event start → ISAPI Recording Trigger issued to each paired Hikvision camera (host-side tests against a fake camera)
- [ ] Outcome (success/failure) logged on the Noise Event and visible in the dashboard
- [ ] Trigger path requires no cloud connectivity (Device→camera over LAN only)
- [ ] Failure flags the camera degraded; measurement and alerting continue uninterrupted
