# 07 — Camera health + unpair/replace

**What to build:** The Device monitors Paired Camera reachability with retry/backoff, flags degraded cameras in the dashboard, and continues Audio-Only behaviour regardless of camera state. The owner can unpair a camera or replace it (re-run test-connect) from the dashboard.

**Blocked by:** 02 — Camera pairing end-to-end.

**Status:** ready-for-agent

- [ ] Unreachable camera → retries with backoff → degraded status visible in the dashboard (host-side firmware tests with a fake camera)
- [ ] Measurement, alerting, and classification are unaffected by camera state
- [ ] Unpair removes cloud metadata and Device-side credentials; replace re-runs test-connect
- [ ] Recovery from degraded back to paired is automatic and visible in the dashboard
