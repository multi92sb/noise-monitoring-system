# Beachhead segment: commercial venues adjacent to residential buildings

`STEP 00` named short-term rental hosts (Airbnb/VRBO) as the primary customer. We are changing the beachhead: the first segment we sell to is **owners of commercial venues (bars, cafés, shops) located next to residential buildings**, whose deliveries, staff, and vehicles generate neighbor noise complaints.

Why: the two things this customer buys — (1) an early warning *before* a neighbor calls the inspection, and (2) objective evidence to confirm or refute a complaint (Noise Event + Sound Class + Event Bookmark) — map directly onto the product. Such venues already run IP cameras, which makes the Paired Camera story (ADR-0001) natural rather than an add-on. The chosen V1 Sound Classes (crate banging, talking, car engine starting) come straight from this scenario.

## Consequences

- `STEP 00`'s target-customer list is demoted: STR hosts remain a valid secondary segment served by Audio-Only Mode, but no longer drive product decisions.
- Device placement moves outdoor (near the delivery/loading area), which affects enclosure, power, and mounting requirements in the spec phase.
- Success metrics in `STEP 00` (BOM < €20, install < 5 min, alert < 15 s) still stand; the 5-first-customers goal now refers to venue owners.
