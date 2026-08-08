# Tonal Feedback — Instructions for Claude Code

Task: add a per-category tonal feedback mode to the counter, replacing nothing —
a third audio mode beside the existing click and off. One change set, one DCR.
Read `CLAUDE.md` first; the closure sweep applies.

## 1. Why (this text seeds the URS rationale)

The operator's eyes are on the microscope; audio is the only free feedback
channel, which is why sound exists at all. The current click carries one bit —
*a* key registered. A per-category tone carries the bit that matters: *which*
key registered. The error it lets the operator catch without looking up is the
real one — hand displaced a key, wrong key pressed. Precedent: the pulse
oximeter's variable-pitch beep (clinicians detect desaturation by ear), and the
earcon literature in HCI on pitch-differentiated categorical feedback in
eyes-busy tasks.

Secondary effect, worth stating in the rationale: because pitch follows the
maturation order of the categories, the count acquires an ambient statistical
texture — a normal marrow sits mostly in the upper register, a blast-rich or
left-shifted marrow sounds progressively darker. Nobody counts the tones;
everyone notices the drift.

Why the current click grates (diagnosis, for the DCR): `playClick` is an 800 Hz
**square** wave — all odd harmonics, in the register alarm tones use — repeated
identically hundreds of times per count. Identical repetition is the
"machine-gun effect"; harmonically rich + shrill + identical is the worst
available combination.

## 2. Locked design decisions — the scope guard

These are decided. Do not add options for them.

- One scale: **C minor pentatonic** (the pentatonic property — no semitone
  intervals — is what makes arbitrary press sequences consonant; the root is C3
  for register, not B, with apologies to the composer).
- Pitch is **derived from the profile's category order**, never configured.
  No key picker, no scale picker, no per-cell tone assignment, no new profile
  schema for tones. Custom profiles get sensible tones automatically.
- Tones never replace visual feedback. The flash remains primary; audio is
  supplementary and its absence (no AudioContext) degrades silently.
- Chime (target reached) and the existing undo/threshold behaviors keep their
  current sounds except as specified in §4.

## 3. The mapping

Let the tallied categories of the active specimen be their displayed order
(upper row then lower row — maturation order in every shipped profile),
1-indexed k, n categories total.

Centering offset so small profiles do not cluster in the mud:
`o = floor((14 − n) / 2)`, and `j = k − 1 + o`.

Minor pentatonic degrees `P = [0, 3, 5, 7, 10]` (semitones):
`s(j) = 12 · floor(j / 5) + P[j mod 5]`
`f(k) = 130.81 · 2^(s(j)/12)`   (root C3 = 130.81 Hz)

Verify in tests, not by trust: n=14 spans C3 130.8 Hz → G5 784 Hz with poly
(k=9) at G4 392 Hz; n=5 spans B♭3 233 → G4 392; n=10 spans F3 175 → E♭5 622.
Every adjacent pair is ≥2 semitones apart by construction — discrimination, not
identification, is the claim.

## 4. Synthesis (extend `AudioEngine`, do not fork it)

- Increment tone: sine; attack 5 ms to peak gain 0.12; exponential decay to
  0.001 by 70 ms total; then stop and disconnect nodes.
- **Humanization** (the anti-machine-gun measure): per press, uniform random
  detune ±10 cents and gain ±20%. The random source must be injectable so tests
  can pin it.
- Undo: **same frequency as the category** (the operator hears *what* was taken
  back), gain 0.08, 40 ms, with a −40 cent downward glide over the duration —
  perceptually "putting it back."
- Chime unchanged. `playTypewriter` — check whether anything still calls it;
  if nothing does, remove it (dead code) and note in the DCR.
- Implementation home: a small UMD module `web/scripts/wbc-tones.js` (pattern:
  `wbc-dialog.js`) exporting the pure functions — `frequencyFor(k, n)`,
  `toneParams(kind)`, jitter given an rng — so the mapping is unit-testable via
  `require` with no AudioContext. `AudioEngine` consumes it. Add the file to the
  service-worker precache, bump `CACHE_VERSION`, update suite 04's shipped-file
  list — the version-coherence and asset gates will hold the build red until
  all three are done, which is the point of them.

## 5. The setting

Three modes: **Off / Click / Tones.**

- Session persistence: extend the existing `wbcds_audio` sessionStorage value.
  Backward compatibility: existing `'on'` reads as `'click'`, `'off'` as
  `'off'`.
- The existing `btnToggleAudio` becomes a three-way cycle with label
  Sound Off → Click → Tones.
- Profile default: the profile `audio` object (now honored per the earlier fix)
  gains one optional field, `mode: "click" | "tones"`, defaulting to `"click"`
  so shipped behavior is unchanged until the pilot says otherwise. Session
  choice overrides profile default, both directions, as today.
- Config editor: extend the Audio checkbox to enabled + mode. Nothing else.

## 6. QMS integration

- **URS**: one new requirement (next free ID), P2, using §1 as rationale.
  Acceptance criteria: distinct pitch per category derived from order;
  discrimination spacing ≥2 semitones; humanization present; mode selectable
  and persisted; visual feedback unaffected in all modes.
- **SRS**: SYS rows for the mapping formula (state it exactly), the three-way
  mode with persistence and precedence, undo articulation, and the
  no-configuration derivation rule.
- **RA-001**: (a) on the existing wrong-key/miscount hazard, record Tones mode
  as an *additional, non-credited* control — it is operator-selectable, so it
  cannot reduce the scored residual; (b) new hazard: operator comes to rely on
  audio and an unavailable AudioContext silences it — mitigation: flash is
  primary, audio supplementary by design; (c) new hazard: adjacent-pitch
  confusion — mitigation: pentatonic spacing, and the claim is discrimination
  not identification.
- **Sweep**: USER-GUIDE, `web/help.html`, README features row, the editor
  page, and the QC-025 claims table if any live document currently states that
  audio is a single uniform click.

## 7. Tests (behavioral — and note suite 06's condition)

Suite 06 is currently grep-style ("the source contains `playClick`"). Write the
new tests behaviorally and, while there, convert what suite 06 greps into real
assertions where cheap — this was a known weakness of the old suite.

- Unit (`require('wbc-tones.js')`): pentatonic degree table; monotonic
  ascending frequencies; the three range checks in §3; centering offset for
  n = 5, 7, 10, 14; jitter bounds with a pinned rng; undo params (same
  frequency, lower gain, shorter, negative glide).
- Behavioral (app-harness, mock AudioContext): in Tones mode a keypress for
  category k requests `frequencyFor(k, n)`; Shift-press requests the undo
  articulation at the same frequency; mode Off requests nothing; mode cycle
  updates label and persists; `'on'`/`'off'` legacy values map correctly.
- E2E: cycle the button, reload, mode persists for the session.
- **Revert-check every one of them** (repo rule): break the mapping, confirm
  the frequency test fails with the symptom; restore.

## 8. Pilot evaluation (attach to the Yale validation, VV-001)

Add one within-subject comparison to the validation session: each participant
counts two practice slides, one in Click, one in Tones, order counterbalanced.
Record: annoyance (1–5), perceived supportiveness (1–5), any self-caught
wrong-key events, and mode preference. Pre-specify the decision rule before
data exists: Tones becomes the shipped profile default only if preferred by a
majority and not rated more annoying than Click. Record the rule in the DCR now
so the decision cannot be quietly re-litigated after the data arrives.

## Acceptance

- [ ] `wbc-tones.js` shipped, precached, in suite 04's list; `CACHE_VERSION` bumped; suite green.
- [ ] Mapping tests pass and were revert-checked; jitter rng injectable.
- [ ] Three-way mode works with legacy value migration; profile default honored; session override wins.
- [ ] Undo sounds the category's own pitch, damped.
- [ ] Visual feedback identical in all three modes.
- [ ] URS/SRS/RA rows added; sweep done; DCR complete; clean-tree evidence run.
- [ ] No new configuration surface beyond `audio.mode`.
- [ ] Pilot A/B question and decision rule recorded in VV-001 and the DCR.
