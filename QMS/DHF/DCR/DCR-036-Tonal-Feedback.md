# DCR-036: Design Change Record — Tonal Feedback

## WBC ΔΣ

| Field | Value |
|-------|-------|
| **Document ID** | DCR-036 |
| **Version** | 1.0 |
| **Date Created** | 2026-08-07 |
| **Status** | **In Review** — engineering approvals complete; **clinical review invited on §7, and one hazard turns on it** |
| **Parent Document** | DHF-001 |
| **Input** | `TONAL-FEEDBACK-PROPOSAL.md`, endorsed by the Document Owner |
| **Creates** | URS-108; SYS-254–258; RA-001 HA-108, HA-109, HA-110; `web/scripts/wbc-tones.js` |

---

## 1. Why

The operator's eyes are on the microscope. Audio is the only feedback channel
that costs nothing to attend to, which is why sound exists in this application
at all.

The present click carries **one bit**: *a* key registered. A per-category tone
carries the bit that matters — *which* key registered — so a hand that has
drifted one key across is audible immediately, without looking up. The precedent
is the variable-pitch pulse oximeter, by which clinicians detect desaturation by
ear while looking elsewhere.

**The claim is discrimination, not identification.** The operator is not asked
to name the pitch for eosinophils; they are asked to notice that this press did
not sound like the last fifty. That is why the mapping only has to guarantee
spacing, and why it needs no training.

### Why the present click tires the ear

`playClick` is `_playTone(800, 'square', 5)` — an 800 Hz **square** wave, all
odd harmonics, in the register alarm tones occupy, repeated identically several
hundred times per count. Identical repetition is the machine-gun effect;
harmonically rich, shrill and identical is the worst available combination.

There is a fourth ingredient the proposal did not name. `_playTone` assigns
`gain.value` directly and then ramps down, so **every note begins with a step
discontinuity** — an onset click on top of the waveform. The new envelope has a
5 ms attack, which removes it.

---

## 2. The Mapping

Minor pentatonic, rooted at C3 (130.81 Hz). For category position `k` of `n`
tallied categories in displayed order:

```
offset = max(0, floor((14 − n) / 2))
j      = k − 1 + offset
s(j)   = 12·floor(j/5) + P[j mod 5]        P = [0, 3, 5, 7, 10]
f      = 130.81 · 2^(s/12)
```

The pentatonic property is load-bearing rather than decorative: it contains **no
semitone intervals**, so adjacent categories are at least two semitones apart
*by construction* at every profile size, and two presses close enough to overlap
form a consonant dyad rather than a beat. VV-TON-002 asserts the spacing for
n = 1..24 rather than trusting the constants.

**Derived, never configured.** There is no tone field in the schema, no scale
picker and no per-category assignment. A laboratory that adds a category gets a
sensible tone automatically, and no tone can disagree with the profile it
belongs to, because there is no second place to state it. This is the rule
`keyboardGrid` follows for the same reason (DCR-034).

### A defect in the specified formula

The endorsed proposal gave the offset as `floor((14 − n) / 2)`, unclamped. For a
profile with **more than fourteen categories** that drives `j` negative, and
since JavaScript's `-1 % 5` is `-1`, `P[-1]` is `undefined` and the frequency is
`NaN`:

```
n = 16:  k = 1                → NaN
n = 20:  k = 1, 2, 3          → NaN
```

The failure is not a crash. It is **silence on the first categories** — which in
every shipped ordering are the erythroid, blast and precursor rows. The tones
would have gone quiet exactly where the feedback matters most, and a
sixteen-category profile is one editor session away from `ndc-14`. The offset is
clamped at zero; VV-TON-006 covers n = 15..24.

Two edges the proposal left open are also closed: `frequencyFor` returns `null`
for a profile with no categories or an out-of-range position, and the caller
falls back to **the click, never to silence** — silence reads as a missed
keypress.

---

## 3. What Ships

| | Behaviour |
|---|---|
| **Increment** | Sine, 5 ms attack, decay to 70 ms, peak gain 0.12 |
| **Undo** | The **same frequency as the category**, gain 0.08, 40 ms, gliding down 40 cents — the operator hears *what* was taken back |
| **Humanisation** | Per press: detune ±10 cents, gain ±20%, from an injectable random source. A tenth of a semitone is an order of magnitude inside the 2-semitone gap, so jitter can never blur two categories |
| **Modes** | Off / Click / **Tones**, cycled from the existing control, persisted per session |
| **Default** | **Click.** Shipped behaviour is unchanged until the pilot says otherwise |
| **Legacy sessions** | `wbcds_audio: 'on'` reads as `'click'` — what those sessions were hearing |
| **Profile default** | `audio.mode`, one optional field. A session choice overrides it in either direction, as before |

`playTypewriter` is **retained**: the proposal asked whether anything still
calls it, and `mdc-app.js` does, on morphology comment input. It is not dead.

---

## 4. The Hazard the Proposal Did Not Have

The proposal noted a secondary effect: because pitch follows category order, a
count acquires an ambient texture — *"Nobody counts the tones; everyone notices
the drift."* It framed this as a benefit.

**It is also a bias risk, and it is now HA-110.**

The operator's task is **classifying ambiguous cells**. An involuntary cue that
correlates with the emerging picture is a plausible anchoring mechanism: a
marrow that starts *sounding* blast-rich at cell 80 puts a thumb on the scale
for the borderline cells at cell 200. The asymmetry with the wrong-key benefit
is the point — that is a detection aid with a clear error model; this influences
judgement and has none. Detection is scored **5**: nothing in the count reveals
whether it happened, and an operator cannot report a bias they did not notice.

Controls, and the reasoning behind each:

- **Tones are not the default.** The mode must be chosen.
- **The texture is deliberately absent from operator-facing documentation.**
  `USER-GUIDE.md` describes only the wrong-key benefit. Naming the texture is
  what would prime the effect, and the benefit does not require the operator to
  know about it. This is a decision to withhold true information from a user,
  which is unusual enough to state plainly here so a reviewer can overrule it.
- **VV-001 §5.4.1 asks about it in the pilot**, open-endedly and *after* both
  counts, for the same reason.

### The texture is weaker than the proposal claims

Computed against the shipped orderings:

```
ndc-14:  nrbc:131  blasts:156  pro:175  myelo:196  meta:233
         plasma:262  mast:311  bands:349  poly:392  baso:466 …
```

**The darkest tone is `nrbc`, not blasts.** An erythroid-hyperplastic marrow —
haemolysis, blood loss, iron deficiency — therefore sounds *darker* than a
blast-packed one, and the cue conflates states a clinician would separate.
Further, §3's premise that displayed order is "maturation order in every shipped
profile" does not hold for `ndc-14`: `plasma` and `mast` sit between `meta` and
`bands`, interrupting the granulocytic sequence.

None of this touches the primary claim, which is about discrimination between
adjacent presses. It does mean the texture should not be advertised, and the
rationale in URS-108 does not mention it.

If a reviewer judges the bias material, the mitigation is to break the
correspondence between pitch order and maturation order. Because the mapping is
derived from a single ordering, that is a one-line change.

---

## 5. Verification

| Case | Layer | What it holds |
|---|---|---|
| **VV-TON-001** | Unit | The scale is the minor pentatonic rooted at C3 |
| **VV-TON-002** | Unit | Adjacent categories are ≥2 semitones apart, for n = 1..24 |
| **VV-TON-003** | Unit | Pitch ascends with position, always |
| **VV-TON-004** | Unit | The specified ranges hold, including `poly` at G4 392 Hz in `ndc-14` |
| **VV-TON-005** | Unit | Small profiles are centred, not left in the mud |
| **VV-TON-006** | Unit | A profile larger than the reference still sounds — the clamp |
| **VV-TON-007** | Unit | An unplaceable category has no frequency rather than a wrong one |
| **VV-TON-010–013** | Unit | Attack present; undo quieter, shorter, falling; jitter bounded and injectable; cents convert |
| **TC-B092, TC-B094** | Behaviour | Three-way cycle persists each mode; a pre-DCR-036 `'on'` still reads |
| **TC-B095** | Behaviour | A counted category sounds *its own* pitch, and no two alike |
| **TC-B096** | Behaviour | An undo sounds the same note, quieter, gliding down |
| **TC-B097** | Behaviour | Click mode is byte-for-byte unchanged; Off requests nothing |
| **TC-B098** | Behaviour | The count is identical in all three modes |
| **VV-SYS-222–223** | System | The control cycles and persists across reload; counting is unaffected |

All revert-checked, including breaking the scale, removing the clamp, removing
the attack, making every category sound alike, making the undo generic, and
letting the mode change the count.

**The harness needed upgrading first.** Its AudioContext stub recorded only that
*something* played — `events.push('tone')` — and its oscillator had no
`setValueAtTime`. The new envelope would have thrown into the engine's own
best-effort catch, turning a broken tone into silence and a failing assertion
into a passing one. The stub now records frequency, waveform, peak gain and
glide, because the claim is entirely about pitch and a stub that counts events
cannot check a claim about pitch.

**Suite 06's two broken greps were converted rather than patched** (proposal §7).
`VV-AUD-015` asserted the source contained `AudioEngine.playClick()`; it broke
the moment the call site gained a mode, and would have kept passing had the call
been left behind in dead code. It now asserts the routing, with the behaviour
covered in jsdom.

### Three of my own errors, each found by the runner

- A `describe` block referenced `path`, which suite 11 does not import. The
  runner reported **`fail 0` while an entire suite failed to build** — the
  summary counts tests, and a suite that never built has none. Worth knowing:
  the pass count is not a safe signal on its own.
- The harness key helper takes `{ shift: true }`, not `{ shiftKey: true }`. My
  undo test was pressing increment twice and asserting on the wrong event.
- `VV-SYS-223` timed out on all three engines because counting and then
  reloading raises the interrupted-count recovery prompt, which covers the audio
  control. Seeding the mode avoids driving the UI through a state the test does
  not care about. I first read "3 passed" as success when six were expected —
  the same misreading recorded in DCR-033 §3.

---

## 6. Risk

No change to any counted value, percentage, ratio or report. TC-B098 and
VV-SYS-223 assert the count is identical in all three modes, which is the
property HA-108 depends on.

`CACHE_VERSION` → `wbcds-v2.22.0`: `wbc-tones.js` is a new shell asset, so an
installed browser must not serve a page referencing a file its cache lacks.

Three hazards added — HA-108 (reliance on audio, residual 12, Low), HA-109
(adjacent-pitch confusion, residual 12, Low), HA-110 (texture bias, residual 27,
Medium, **accepted pending clinical review**).

No preset, schema field, rounding method or CI level was removed. The only new
configuration surface is `audio.mode`.

---

## 7. What a Clinical Reviewer Is Asked

**One question, and HA-110 turns on the answer.**

Pitch follows category order, so a count acquires an audible texture that
correlates with the emerging picture, while the operator is classifying
ambiguous cells. §4 sets out why this is a plausible anchoring mechanism, why
the texture is weaker than it first appears, and why it is kept out of the user
guide.

1. Is the bias material enough to change the design? If so, the pitch order can
   be decoupled from the maturation order in one line.
2. Is withholding the texture from operator documentation the right call, or
   should operators be told and trusted?

Secondary: whether "discrimination, not identification" is the right claim to
make to an operator, or whether tones invite more confidence than they earn.

---

## 8. Revision History

| Rev | Date | Author | Description |
|-----|------|--------|-------------|
| A | 2026-08-07 | QMS | Initial issue. `wbc-tones.js` added and precached; three-way audio mode with legacy migration and profile default; pentatonic mapping with the offset clamped, closing a NaN defect in the endorsed formula; HA-110 added for the texture bias, which the proposal did not carry; pilot protocol pre-registered in VV-001 §5.4.1. URS-108, SYS-254–258, VV-TON-001–013, TC-B092–098, VV-SYS-222–223. |

---

## 9. Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Clinical Reviewer** | | | **required before Tones is made a default — see §7** |
| Design Engineer | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
| Quality Assurance | Peter Gershkovich, M.D., M.H.A. | /s/ Peter Gershkovich — info@openpathology.tech | 2026-08-07 |
