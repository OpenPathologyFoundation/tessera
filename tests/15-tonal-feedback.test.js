/**
 * TEST SUITE 15: Tonal Feedback
 * ==============================
 * Traces to: URS-108; SYS-254..SYS-258
 * FMEA: HA-108 (reliance on audio), HA-109 (adjacent-pitch confusion),
 *       HA-110 (ambient texture biasing classification)
 *
 * The operator's eyes are on the microscope, so audio is the only free
 * feedback channel. The click carries one bit — *a* key registered. A
 * per-category tone carries the bit that matters: *which* key registered.
 *
 * The claim under test is DISCRIMINATION, not identification: an operator is
 * not expected to name a pitch, only to notice that this press did not sound
 * like the last fifty. That is why these tests assert spacing and derivation
 * rather than any absolute musical property.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const Tones = require(path.join(__dirname, '..', 'web', 'scripts', 'wbc-tones.js'));

describe('The pentatonic mapping (SYS-254)', () => {

    it('VV-TON-001: The scale is the minor pentatonic, rooted at C3', () => {
        assert.deepEqual(Tones.PENTATONIC, [0, 3, 5, 7, 10]);
        assert.equal(Tones.ROOT_HZ, 130.81);
        assert.equal(Tones.frequencyFor(1, 14).toFixed(2), '130.81');
    });

    it('VV-TON-002: Adjacent categories are at least two semitones apart', () => {
        // The discrimination guarantee, and the reason the scale is pentatonic
        // rather than diatonic: no semitone intervals exist in it, so no two
        // neighbouring categories can land a semitone apart however many
        // categories a profile has.
        let smallest = Infinity;
        for (let n = 1; n <= 24; n++) {
            for (let k = 2; k <= n; k++) {
                const lo = Tones.frequencyFor(k - 1, n);
                const hi = Tones.frequencyFor(k, n);
                const semitones = 12 * Math.log2(hi / lo);
                smallest = Math.min(smallest, semitones);
            }
        }
        assert.ok(smallest >= 2 - 1e-9,
            `closest adjacent pair is ${smallest.toFixed(3)} semitones apart`);
    });

    it('VV-TON-003: Pitch ascends with position, always', () => {
        for (let n = 1; n <= 24; n++) {
            for (let k = 2; k <= n; k++) {
                assert.ok(Tones.frequencyFor(k, n) > Tones.frequencyFor(k - 1, n),
                    `n=${n}: category ${k} is not above ${k - 1}`);
            }
        }
    });

    it('VV-TON-004: The stated ranges hold for the shipped profile sizes', () => {
        // The three checks the design specified, asserted rather than trusted.
        const at = (k, n) => Number(Tones.frequencyFor(k, n).toFixed(0));
        assert.equal(at(1, 14), 131);   // C3
        assert.equal(at(14, 14), 784);  // G5
        assert.equal(at(9, 14), 392);   // G4 — segmented neutrophils in ndc-14
        assert.equal(at(1, 5), 233);    // B♭3
        assert.equal(at(5, 5), 392);    // G4
        assert.equal(at(1, 10), 175);   // F3
        assert.equal(at(10, 10), 622);  // E♭5
    });

    it('VV-TON-005: Small profiles are centred, not left in the mud', () => {
        // A five-category panel starts above a fourteen-category one, because
        // the offset lifts it into a comfortable register.
        assert.ok(Tones.frequencyFor(1, 5) > Tones.frequencyFor(1, 14));
        assert.ok(Tones.frequencyFor(1, 10) > Tones.frequencyFor(1, 14));
        assert.equal(Tones.frequencyFor(1, 14), Tones.ROOT_HZ, 'the reference size starts at the root');
    });

    it('VV-TON-006: A profile larger than the reference still sounds', () => {
        /**
         * The centring offset is clamped at zero. Unclamped, a profile with
         * more than fourteen categories drives the scale index negative, and
         * JavaScript's `-1 % 5` is `-1`, so the degree lookup is undefined and
         * the frequency is NaN — silently, and for the FIRST categories, which
         * in every shipped ordering are the erythroid, blast and precursor
         * rows. The tones would have gone quiet exactly where they matter
         * most, and a sixteen-category profile is one editor session away.
         */
        for (const n of [15, 16, 20, 24]) {
            for (let k = 1; k <= n; k++) {
                const f = Tones.frequencyFor(k, n);
                assert.ok(typeof f === 'number' && isFinite(f) && f > 0,
                    `n=${n}, k=${k} produced ${f}`);
            }
        }
        assert.equal(Tones.frequencyFor(1, 16), Tones.ROOT_HZ);
    });

    it('VV-TON-007: An unplaceable category has no frequency, rather than a wrong one', () => {
        // The caller falls back to the click. Returning a number here would
        // give the blank template a confident tone for a category it does not
        // have.
        for (const [k, n] of [[1, 0], [0, 14], [15, 14], [-1, 5], [1, -3]]) {
            assert.equal(Tones.frequencyFor(k, n), null, `frequencyFor(${k}, ${n})`);
        }
        assert.equal(Tones.frequencyFor('2', 14), null, 'a string index is not a position');
        assert.equal(Tones.frequencyFor(NaN, 14), null);
    });
});

// ================================================================
describe('Articulation (SYS-255, SYS-256)', () => {

    it('VV-TON-010: An increment has a real attack', () => {
        // The existing click sets its gain directly and ramps down, so every
        // note begins with a step discontinuity — an onset click on top of an
        // 800 Hz square wave, and a large part of why it tires the ear.
        const p = Tones.toneParams('increment');
        assert.equal(p.type, 'sine');
        assert.ok(p.attackMs > 0, 'no attack means an onset discontinuity');
        assert.ok(p.durationMs > p.attackMs);
        assert.equal(p.glideCents, 0);
    });

    it('VV-TON-011: An undo is the same note, damped and falling', () => {
        // The operator hears WHAT was taken back, not that something was.
        const inc = Tones.toneParams('increment');
        const undo = Tones.toneParams('undo');
        assert.ok(undo.peakGain < inc.peakGain, 'undo must be quieter');
        assert.ok(undo.durationMs < inc.durationMs, 'undo must be shorter');
        assert.ok(undo.glideCents < 0, 'undo must fall, not rise');
    });

    it('VV-TON-012: Humanisation is bounded, and its randomness is injectable', () => {
        // Identical repetition is what makes a repeated sound intrusive. The
        // variation must be enough to break sameness and small enough never to
        // be heard as a wrong note.
        const base = Tones.toneParams('increment');

        const low = Tones.humanize(base, () => 0);      // both draws at minimum
        const high = Tones.humanize(base, () => 1);     // both at maximum
        assert.equal(low.detuneCents, -10);
        assert.equal(high.detuneCents, 10);
        assert.ok(Math.abs(low.peakGain - base.peakGain * 0.8) < 1e-12);
        assert.ok(Math.abs(high.peakGain - base.peakGain * 1.2) < 1e-12);

        // ±10 cents is a tenth of a semitone — an order of magnitude inside
        // the 2-semitone discrimination gap, so jitter can never blur two
        // categories together.
        assert.ok(Math.abs(high.detuneCents) < 100 / 2);

        // Nothing else is disturbed.
        for (const key of ['type', 'attackMs', 'durationMs', 'glideCents']) {
            assert.equal(low[key], base[key], `humanisation changed ${key}`);
        }
    });

    it('VV-TON-013: Cents convert to a frequency ratio', () => {
        assert.ok(Math.abs(Tones.centsToRatio(0) - 1) < 1e-12);
        assert.ok(Math.abs(Tones.centsToRatio(1200) - 2) < 1e-9, 'an octave is 1200 cents');
        assert.ok(Tones.centsToRatio(-40) < 1, 'a downward glide lowers the frequency');
    });
});
