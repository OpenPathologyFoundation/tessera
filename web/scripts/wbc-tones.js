/**
 * WBC ΔΣ — Tonal feedback mapping
 * ================================
 * Implements: URS-108, SYS-254..SYS-258.
 *
 * The operator's eyes are on the microscope, so audio is the only feedback
 * channel that is free. The existing click carries one bit — *a* key
 * registered. A per-category tone carries the bit that matters: *which* key
 * registered, so a displaced hand or a wrong key is catchable without looking
 * up.
 *
 * The claim is DISCRIMINATION, not identification. An operator is not expected
 * to name the pitch for eosinophils; they are expected to notice that this
 * press did not sound like the last fifty. That is why the mapping only has to
 * guarantee spacing, and why it needs no training.
 *
 * DERIVED, NEVER CONFIGURED. Pitch comes from the profile's category order. A
 * laboratory that adds a category gets a sensible tone for it automatically,
 * and no tone can ever disagree with the profile it belongs to, because there
 * is no second place to state it. This is the same rule as the keyboard grid
 * in wbc-core: a pure function of the configuration has no state to drift.
 *
 * This module is DOM-free and free of AudioContext so the mapping is unit
 * testable through `require`. AudioEngine consumes it; it knows nothing about
 * AudioEngine.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WBCTones = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Minor pentatonic degrees, in semitones above the root.
     *
     * The pentatonic property is load-bearing rather than decorative: with no
     * semitone intervals, an arbitrary sequence of presses stays consonant,
     * and two presses close enough to overlap form a dyad rather than a beat.
     * The gaps are 3, 2, 2, 3 and then 2 back to the octave — so every
     * adjacent pair is at least two semitones apart BY CONSTRUCTION, which is
     * the discrimination guarantee. VV-TON-002 asserts it rather than trusting
     * this comment.
     */
    var PENTATONIC = [0, 3, 5, 7, 10];

    /** C3. Chosen for register: low enough to leave headroom for 14 categories. */
    var ROOT_HZ = 130.81;

    /** The category count the scale is centred on — the full ICSH panel. */
    var REFERENCE_N = 14;

    /**
     * The frequency for category k of n, or null when there is none.
     *
     * Small profiles are centred rather than left at the bottom of the range,
     * so a five-category panel sits in a comfortable register instead of the
     * mud.
     *
     * The offset is clamped at zero. Without the clamp a profile with MORE
     * than fourteen categories drives `j` negative, and since JavaScript's
     * `-1 % 5` is `-1`, `PENTATONIC[-1]` is undefined and the frequency is
     * NaN — silently, for the FIRST few categories, which in every shipped
     * ordering are the erythroid, blast and precursor rows. The tones would
     * have gone quiet exactly where the feedback matters most. A sixteen
     * category profile is not hypothetical: the configuration editor builds
     * one from ndc-14 plus two additions. See VV-TON-006.
     */
    function frequencyFor(k, n) {
        if (typeof k !== 'number' || typeof n !== 'number') return null;
        if (!isFinite(k) || !isFinite(n)) return null;
        if (n <= 0 || k < 1 || k > n) return null;

        var offset = Math.max(0, Math.floor((REFERENCE_N - n) / 2));
        var j = k - 1 + offset;
        var semitones = 12 * Math.floor(j / PENTATONIC.length) +
            PENTATONIC[j % PENTATONIC.length];
        return ROOT_HZ * Math.pow(2, semitones / 12);
    }

    /**
     * Envelope and timbre per event kind.
     *
     * `increment` uses a sine with a real 5 ms attack. The existing click sets
     * its gain directly and ramps down, so it begins with a discontinuity —
     * an onset click on top of an 800 Hz square wave, which is a large part of
     * why it is tiring. An attack removes that.
     *
     * `undo` sounds the SAME frequency as the category, so the operator hears
     * what was taken back rather than a generic "something was undone". It is
     * quieter, shorter, and glides down 40 cents: perceptually, putting it
     * back.
     */
    function toneParams(kind) {
        if (kind === 'undo') {
            return {
                type: 'sine',
                peakGain: 0.08,
                attackMs: 3,
                durationMs: 40,
                glideCents: -40
            };
        }
        return {
            type: 'sine',
            peakGain: 0.12,
            attackMs: 5,
            durationMs: 70,
            glideCents: 0
        };
    }

    /**
     * Per-press variation — the anti-machine-gun measure.
     *
     * Identical repetition is what makes a repeated sound intrusive; the ear
     * habituates to variation and sensitises to sameness. A few cents of
     * detune and a little gain variation are below the threshold of being
     * heard as wrong, and above the threshold of being heard as mechanical.
     *
     * The random source is injected so a test can pin it. Defaults to
     * Math.random only when nothing is supplied.
     */
    function humanize(params, rng) {
        var random = typeof rng === 'function' ? rng : Math.random;
        var detuneCents = (random() * 2 - 1) * 10;      // ±10 cents
        var gainFactor = 1 + (random() * 2 - 1) * 0.2;  // ±20%
        return {
            type: params.type,
            peakGain: params.peakGain * gainFactor,
            attackMs: params.attackMs,
            durationMs: params.durationMs,
            glideCents: params.glideCents,
            detuneCents: detuneCents
        };
    }

    /** Semitone ratio for a cent offset, for applying detune and glide. */
    function centsToRatio(cents) {
        return Math.pow(2, cents / 1200);
    }

    return {
        PENTATONIC: PENTATONIC,
        ROOT_HZ: ROOT_HZ,
        REFERENCE_N: REFERENCE_N,
        frequencyFor: frequencyFor,
        toneParams: toneParams,
        humanize: humanize,
        centsToRatio: centsToRatio
    };
}));
