'use strict';

/**
 * tests/rheology-printability.test.js — Comprehensive tests for
 * analyzePrintability branch coverage and cross-model integration.
 *
 * Targets the four uncovered lines in rheology.js (mild shear-thinning
 * branch, too-high print viscosity branch) plus deep integration testing
 * of printability analysis with real bioink presets at custom conditions,
 * cross-model viscosity comparison, and numerical edge cases in the
 * scoring algorithm.
 */

const { createRheologyModeler } = require('../docs/shared/rheology');

describe('analyzePrintability — uncovered branches & integration', () => {
    let m;

    beforeAll(() => {
        m = createRheologyModeler();
    });

    // ── Mild shear-thinning branch (n 0.8..1.0) — lines 333-334 ────

    describe('mild shear-thinning (0.8 <= n < 1.0)', () => {
        it('scores marginal for n=0.85', () => {
            const r = m.analyzePrintability({ K: 10, n: 0.85 });
            const st = r.factors.find(f => f.name === 'Shear Thinning');
            expect(st.status).toBe('marginal');
            expect(st.score).toBe(10);
            expect(st.max).toBe(25);
            expect(st.detail).toContain('Mild shear-thinning');
            expect(st.detail).toContain('0.85');
        });

        it('scores marginal at boundary n=0.8', () => {
            const r = m.analyzePrintability({ K: 10, n: 0.8 });
            const st = r.factors.find(f => f.name === 'Shear Thinning');
            expect(st.status).toBe('marginal');
            expect(st.score).toBe(10);
        });

        it('scores marginal at n=0.99 (just below Newtonian)', () => {
            const r = m.analyzePrintability({ K: 10, n: 0.99 });
            const st = r.factors.find(f => f.name === 'Shear Thinning');
            expect(st.status).toBe('marginal');
            expect(r.shearThinning).toBe(true);
            expect(r.flowBehavior).toBe('shear-thinning');
        });

        it('mild shear-thinning scores higher than Newtonian but lower than moderate', () => {
            const mild = m.analyzePrintability({ K: 10, n: 0.9, yieldStress: 50 });
            const newt = m.analyzePrintability({ K: 10, n: 1.0, yieldStress: 50 });
            const moderate = m.analyzePrintability({ K: 10, n: 0.6, yieldStress: 50 });
            expect(mild.score).toBeGreaterThan(newt.score);
            expect(mild.score).toBeLessThan(moderate.score);
        });
    });

    // ── Too-high print viscosity branch — lines 351-352 ────────────

    describe('too-high print viscosity', () => {
        it('scores poor when viscosity exceeds maxViscosity', () => {
            // Very high K with shear-thinning n = high viscosity at print rate
            const r = m.analyzePrintability({ K: 50000, n: 0.95, maxViscosity: 1000 });
            const pv = r.factors.find(f => f.name === 'Print Viscosity');
            expect(pv.status).toBe('poor');
            expect(pv.score).toBe(5);
            expect(pv.detail).toContain('Too high');
        });

        it('scores poor for borderline above max', () => {
            // K=1001 at shear rate 100 with n=1 gives exactly 1001 Pa·s > 1000 default max
            const r = m.analyzePrintability({ K: 1001, n: 1.0 });
            const pv = r.factors.find(f => f.name === 'Print Viscosity');
            expect(pv.status).toBe('poor');
            expect(pv.detail).toContain('Too high');
        });

        it('scores poor for extreme K values', () => {
            const r = m.analyzePrintability({ K: 1e6, n: 1.0 });
            const pv = r.factors.find(f => f.name === 'Print Viscosity');
            expect(pv.score).toBe(5);
        });

        it('too-high viscosity differs from too-low viscosity detail', () => {
            const high = m.analyzePrintability({ K: 50000, n: 1.0 });
            const low = m.analyzePrintability({ K: 0.001, n: 0.3 });
            const pvHigh = high.factors.find(f => f.name === 'Print Viscosity');
            const pvLow = low.factors.find(f => f.name === 'Print Viscosity');
            expect(pvHigh.detail).toContain('Too high');
            expect(pvLow.detail).toContain('Too low');
        });
    });

    // ── Scoring algorithm numerical properties ─────────────────────

    describe('scoring algorithm properties', () => {
        it('ideal bioink scores very high', () => {
            // Strong shear-thinning, viscosity in sweet spot, high ratio, good yield
            const r = m.analyzePrintability({
                K: 50, n: 0.3, yieldStress: 100,
                printShearRate: 100, minViscosity: 1, maxViscosity: 1000
            });
            // Score depends on how close viscosity is to the center of the window;
            // K=50, n=0.3, rate=100 → η ≈ 1.99 Pa·s, near min of [1,1000]
            expect(r.score).toBeGreaterThanOrEqual(80);
            expect(r.printable).toBe(true);
            expect(r.shearThinning).toBe(true);
            expect(r.flowBehavior).toBe('strongly shear-thinning');
        });

        it('worst bioink scores near minimum', () => {
            // Newtonian, way out of viscosity window, no yield stress
            const r = m.analyzePrintability({
                K: 1e6, n: 1.5, printShearRate: 100
            });
            expect(r.score).toBeLessThan(20);
            expect(r.printable).toBe(false);
        });

        it('score is always 0-100 integer', () => {
            const cases = [
                { K: 1, n: 0.1 },
                { K: 100, n: 0.5, yieldStress: 50 },
                { K: 0.01, n: 1.5 },
                { K: 1000, n: 0.8, yieldStress: 1000 },
            ];
            for (const params of cases) {
                const r = m.analyzePrintability(params);
                expect(Number.isInteger(r.score)).toBe(true);
                expect(r.score).toBeGreaterThanOrEqual(0);
                expect(r.score).toBeLessThanOrEqual(100);
            }
        });

        it('custom printShearRate changes the result', () => {
            const r1 = m.analyzePrintability({ K: 10, n: 0.5, printShearRate: 1 });
            const r2 = m.analyzePrintability({ K: 10, n: 0.5, printShearRate: 10000 });
            expect(r1.viscosityAtPrint).not.toBeCloseTo(r2.viscosityAtPrint);
        });

        it('custom viscosity window changes printable result', () => {
            // With tight window, viscosity will be outside
            const wide = m.analyzePrintability({ K: 10, n: 0.5, minViscosity: 0.01, maxViscosity: 10000 });
            const narrow = m.analyzePrintability({ K: 10, n: 0.5, minViscosity: 0.01, maxViscosity: 0.02 });
            expect(wide.score).toBeGreaterThan(narrow.score);
        });
    });

    // ── Viscosity ratio scoring edge cases ──────────────────────────

    describe('viscosity ratio scoring', () => {
        it('ratio exactly 100x scores excellent', () => {
            // n such that K*1^(n-1) / K*1000^(n-1) = 100
            // ratio = 1000^(1-n) = 100 → (1-n)*log(1000)=log(100) → 1-n=2/3 → n=1/3
            const r = m.analyzePrintability({ K: 10, n: 1/3 });
            const vr = r.factors.find(f => f.name === 'Viscosity Ratio');
            expect(vr.status).toBe('excellent');
            expect(vr.score).toBe(25);
        });

        it('low ratio (near Newtonian) scores marginal', () => {
            const r = m.analyzePrintability({ K: 10, n: 0.99 });
            const vr = r.factors.find(f => f.name === 'Viscosity Ratio');
            expect(vr.status).toBe('marginal');
            expect(vr.score).toBe(5);
        });

        it('moderate ratio scores good with interpolated score', () => {
            // n=0.5 → ratio = 1000^0.5 ≈ 31.6x (between 10 and 100)
            const r = m.analyzePrintability({ K: 10, n: 0.5 });
            const vr = r.factors.find(f => f.name === 'Viscosity Ratio');
            expect(vr.status).toBe('good');
            expect(vr.score).toBeGreaterThan(5);
            expect(vr.score).toBeLessThan(25);
        });
    });

    // ── Preset integration — analyze all presets at various conditions ──

    describe('bioink preset integration', () => {
        it('all presets are printable at default conditions', () => {
            const presets = m.getBioinkPresets();
            for (const p of presets) {
                const r = m.analyzePrintability(p);
                expect(r.printable).toBe(true);
                expect(r.score).toBeGreaterThanOrEqual(50);
            }
        });

        it('preset viscosity matches powerLawViscosity at same shear rate', () => {
            const presets = m.getBioinkPresets();
            for (const p of presets) {
                const r = m.analyzePrintability(p);
                const directVisc = m.powerLawViscosity(p.K, p.n, 100);
                expect(r.viscosityAtPrint).toBeCloseTo(directVisc, 10);
            }
        });

        it('GelMA 5% is strongly shear-thinning', () => {
            const gelma = m.getBioinkPresets().find(p => p.id === 'gelma-5pct');
            const r = m.analyzePrintability(gelma);
            expect(r.flowBehavior).toContain('shear-thinning');
        });

        it('Pluronic F-127 has highest printability score (strong thinning + high yield)', () => {
            const presets = m.getBioinkPresets();
            const scores = presets.map(p => ({
                id: p.id,
                score: m.analyzePrintability(p).score
            }));
            const pluronic = scores.find(s => s.id === 'pluronic-25pct');
            // Pluronic has n=0.35 and yieldStress=120 — should be top scorer
            expect(pluronic.score).toBe(Math.max(...scores.map(s => s.score)));
        });
    });

    // ── Cross-model integration with printability ────────────────────

    describe('cross-model integration', () => {
        it('Cross viscosity at print rate matches expected for printability', () => {
            // Using Cross model to verify viscosity, then check printability
            const eta0 = 500, etaInf = 0.5, lambda = 0.1, mVal = 0.8;
            const printRate = 100;
            const crossVisc = m.crossViscosity(eta0, etaInf, lambda, mVal, printRate);
            // crossVisc at rate 100 with these params should be well below eta0
            expect(crossVisc).toBeGreaterThan(etaInf);
            expect(crossVisc).toBeLessThan(eta0);
        });

        it('Herschel-Bulkley stress at zero rate equals yield stress', () => {
            const ys = 42;
            const stress = m.herschelBulkleyStress(ys, 10, 0.5, 0);
            expect(stress).toBe(ys);
        });

        it('Arrhenius + printability: cooling increases viscosity', () => {
            const hot = m.arrheniusViscosity(10, 37, 50, 37);
            const cold = m.arrheniusViscosity(10, 37, 50, 20);
            expect(cold).toBeGreaterThan(hot);
        });
    });

    // ── Temperature curve integration ───────────────────────────────

    describe('temperature curve integration', () => {
        it('curve endpoints match direct Arrhenius calculation', () => {
            const ref = 10, refT = 25, Ea = 50;
            const curve = m.temperatureCurve(ref, refT, Ea, 20, 40, 5);
            expect(curve[0].viscosity).toBeCloseTo(
                m.arrheniusViscosity(ref, refT, Ea, 20), 10
            );
            expect(curve[curve.length - 1].viscosity).toBeCloseTo(
                m.arrheniusViscosity(ref, refT, Ea, 40), 10
            );
        });

        it('custom step produces correct number of points', () => {
            const curve = m.temperatureCurve(10, 25, 50, 10, 50, 10);
            expect(curve).toHaveLength(5); // 10, 20, 30, 40, 50
        });
    });

    // ── nozzleShearRate + estimateFlowRate integration ────────────────

    describe('flow rate + shear rate integration', () => {
        it('estimated flow rate produces reasonable shear rates', () => {
            const speed = 20;     // mm/s
            const nozzle = 0.4;   // mm
            const layer = 0.2;    // mm
            const fr = m.estimateFlowRate(speed, nozzle, layer);
            const sr = m.nozzleShearRate(fr, nozzle, 0.5);
            expect(sr).toBeGreaterThan(0);
            expect(Number.isFinite(sr)).toBe(true);
        });

        it('doubling nozzle diameter reduces shear rate', () => {
            const sr1 = m.nozzleShearRate(1, 0.2, 0.5);
            const sr2 = m.nozzleShearRate(1, 0.4, 0.5);
            expect(sr2).toBeLessThan(sr1);
        });

        it('Rabinowitsch correction for n=0.5 is 1.25x Newtonian', () => {
            const srN = m.nozzleShearRate(1, 0.4, 1);
            const sr05 = m.nozzleShearRate(1, 0.4, 0.5);
            const correction = (3 * 0.5 + 1) / (4 * 0.5); // 2.5/2 = 1.25
            expect(sr05 / srN).toBeCloseTo(correction, 10);
        });
    });

    // ── fitPowerLaw integration with curves ─────────────────────────

    describe('fitPowerLaw round-trip with powerLawCurve', () => {
        it('recovers parameters from generated curve data', () => {
            const K = 15, n = 0.45;
            const curve = m.powerLawCurve(K, n, 1, 1000, 20);
            const data = curve.map(p => ({
                shearRate: p.shearRate,
                viscosity: p.viscosity
            }));
            const fit = m.fitPowerLaw(data);
            expect(fit.K).toBeCloseTo(K, 3);
            expect(fit.n).toBeCloseTo(n, 3);
            expect(fit.rSquared).toBeCloseTo(1, 6);
        });

        it('handles noisy data with reasonable R²', () => {
            const K = 10, n = 0.5;
            const rates = [1, 5, 10, 50, 100, 500, 1000];
            const data = rates.map(sr => ({
                shearRate: sr,
                viscosity: K * Math.pow(sr, n - 1) * (0.9 + 0.2 * Math.random())
            }));
            const fit = m.fitPowerLaw(data);
            expect(fit.rSquared).toBeGreaterThan(0.8);
            expect(fit.K).toBeGreaterThan(0);
        });
    });

    // ── _logSpacedCurve edge behaviour via crossCurve/powerLawCurve ─

    describe('log-spaced curve edge cases', () => {
        it('exactly 2 points produces min and max only', () => {
            const curve = m.powerLawCurve(10, 0.5, 1, 100, 2);
            expect(curve).toHaveLength(2);
            expect(curve[0].shearRate).toBeCloseTo(1, 5);
            expect(curve[1].shearRate).toBeCloseTo(100, 5);
        });

        it('crossCurve uses defaults when params omitted', () => {
            const curve = m.crossCurve(100, 1, 0.1, 0.8);
            expect(curve).toHaveLength(50);
            expect(curve[0].shearRate).toBeCloseTo(0.01, 5);
        });

        it('crossCurve viscosity decreases monotonically', () => {
            const curve = m.crossCurve(100, 1, 0.1, 0.8, 0.01, 1000, 30);
            for (let i = 1; i < curve.length; i++) {
                expect(curve[i].viscosity).toBeLessThanOrEqual(curve[i - 1].viscosity);
            }
        });
    });
});
