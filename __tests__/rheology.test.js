'use strict';

const { createRheologyModeler } = require('../docs/shared/rheology');

describe('Rheology Module — Edge Cases & Error Handling', () => {
    let modeler;

    beforeAll(() => {
        modeler = createRheologyModeler();
    });

    describe('powerLawViscosity — validation', () => {
        it('throws on non-numeric K', () => {
            expect(() => modeler.powerLawViscosity('a', 0.5, 10)).toThrow('must be numbers');
        });

        it('throws on non-numeric n', () => {
            expect(() => modeler.powerLawViscosity(1, null, 10)).toThrow('must be numbers');
        });

        it('throws on non-numeric shearRate', () => {
            expect(() => modeler.powerLawViscosity(1, 0.5, undefined)).toThrow('must be numbers');
        });

        it('throws on K <= 0', () => {
            expect(() => modeler.powerLawViscosity(0, 0.5, 10)).toThrow('K must be positive');
            expect(() => modeler.powerLawViscosity(-1, 0.5, 10)).toThrow('K must be positive');
        });

        it('throws on shearRate <= 0', () => {
            expect(() => modeler.powerLawViscosity(1, 0.5, 0)).toThrow('Shear rate must be positive');
            expect(() => modeler.powerLawViscosity(1, 0.5, -5)).toThrow('Shear rate must be positive');
        });

        it('returns K when n = 1 (Newtonian)', () => {
            expect(modeler.powerLawViscosity(5, 1, 100)).toBeCloseTo(5, 10);
        });

        it('handles very small shear rates', () => {
            const v = modeler.powerLawViscosity(10, 0.3, 0.001);
            expect(v).toBeGreaterThan(0);
            expect(Number.isFinite(v)).toBe(true);
        });

        it('handles very large shear rates', () => {
            const v = modeler.powerLawViscosity(10, 0.3, 1e6);
            expect(v).toBeGreaterThan(0);
            expect(Number.isFinite(v)).toBe(true);
        });
    });

    describe('powerLawCurve — defaults and boundaries', () => {
        it('uses default params when omitted', () => {
            const curve = modeler.powerLawCurve(10, 0.5);
            expect(curve).toHaveLength(50);
            expect(curve[0].shearRate).toBeCloseTo(0.1, 5);
        });

        it('throws when minRate >= maxRate', () => {
            expect(() => modeler.powerLawCurve(10, 0.5, 100, 10, 50)).toThrow('minRate must be less than maxRate');
        });

        it('throws when rate bounds are negative', () => {
            expect(() => modeler.powerLawCurve(10, 0.5, -1, 100, 50)).toThrow('Rate bounds must be positive');
        });

        it('treats zero minRate as falsy and uses default', () => {
            // 0 is falsy in JS, so minRate || 0.1 defaults to 0.1
            const curve = modeler.powerLawCurve(10, 0.5, 0, 100, 10);
            expect(curve[0].shearRate).toBeCloseTo(0.1, 5);
        });

        it('throws when points < 2', () => {
            expect(() => modeler.powerLawCurve(10, 0.5, 0.1, 1000, 1)).toThrow('Need at least 2 points');
        });

        it('generates monotonically increasing shear rates', () => {
            const curve = modeler.powerLawCurve(10, 0.5, 1, 100, 20);
            for (let i = 1; i < curve.length; i++) {
                expect(curve[i].shearRate).toBeGreaterThan(curve[i - 1].shearRate);
            }
        });

        it('generates decreasing viscosity for shear-thinning (n < 1)', () => {
            const curve = modeler.powerLawCurve(10, 0.4, 1, 100, 20);
            for (let i = 1; i < curve.length; i++) {
                expect(curve[i].viscosity).toBeLessThan(curve[i - 1].viscosity);
            }
        });

        it('generates increasing viscosity for shear-thickening (n > 1)', () => {
            const curve = modeler.powerLawCurve(10, 1.5, 1, 100, 20);
            for (let i = 1; i < curve.length; i++) {
                expect(curve[i].viscosity).toBeGreaterThan(curve[i - 1].viscosity);
            }
        });
    });

    describe('fitPowerLaw — edge cases', () => {
        it('throws with less than 2 data points', () => {
            expect(() => modeler.fitPowerLaw([{ shearRate: 1, viscosity: 1 }])).toThrow('at least 2 data points');
        });

        it('throws with non-array input', () => {
            expect(() => modeler.fitPowerLaw('bad')).toThrow('at least 2 data points');
        });

        it('throws when all data points are invalid (zero/negative)', () => {
            expect(() => modeler.fitPowerLaw([
                { shearRate: 0, viscosity: 5 },
                { shearRate: -1, viscosity: 3 }
            ])).toThrow('at least 2 valid positive data points');
        });

        it('filters out invalid data points and fits valid ones', () => {
            const result = modeler.fitPowerLaw([
                { shearRate: 0, viscosity: 0 },
                { shearRate: 1, viscosity: 10 },
                { shearRate: 10, viscosity: 3.16 },
                { shearRate: 100, viscosity: 1 }
            ]);
            expect(result.K).toBeGreaterThan(0);
            expect(result.n).toBeLessThan(1);
            expect(result.rSquared).toBeGreaterThan(0.9);
        });

        it('recovers exact power law parameters from synthetic data', () => {
            const K = 5, n = 0.6;
            const data = [1, 10, 100, 1000].map(sr => ({
                shearRate: sr,
                viscosity: K * Math.pow(sr, n - 1)
            }));
            const fit = modeler.fitPowerLaw(data);
            expect(fit.K).toBeCloseTo(K, 4);
            expect(fit.n).toBeCloseTo(n, 4);
            expect(fit.rSquared).toBeCloseTo(1, 6);
        });
    });

    describe('crossViscosity — validation', () => {
        it('throws on non-positive eta0', () => {
            expect(() => modeler.crossViscosity(0, 0, 1, 1, 10)).toThrow('Zero-shear viscosity must be positive');
        });

        it('throws on negative etaInf', () => {
            expect(() => modeler.crossViscosity(100, -1, 1, 1, 10)).toThrow('Infinite-shear viscosity must be non-negative');
        });

        it('throws on non-positive lambda', () => {
            expect(() => modeler.crossViscosity(100, 0, 0, 1, 10)).toThrow('Relaxation time must be positive');
        });

        it('throws on non-positive m', () => {
            expect(() => modeler.crossViscosity(100, 0, 1, 0, 10)).toThrow('Cross rate constant must be positive');
        });

        it('throws on negative shear rate', () => {
            expect(() => modeler.crossViscosity(100, 0, 1, 1, -1)).toThrow('Shear rate must be non-negative');
        });

        it('throws when eta0 < etaInf', () => {
            expect(() => modeler.crossViscosity(5, 10, 1, 1, 10)).toThrow('Zero-shear viscosity must be >= infinite-shear viscosity');
        });

        it('returns eta0 when shearRate is 0', () => {
            expect(modeler.crossViscosity(100, 1, 1, 1, 0)).toBe(100);
        });

        it('approaches etaInf at very high shear rates', () => {
            const v = modeler.crossViscosity(100, 1, 1, 1, 1e12);
            expect(v).toBeCloseTo(1, 0);
        });

        it('approaches eta0 at very low shear rates', () => {
            const v = modeler.crossViscosity(100, 1, 1, 1, 1e-12);
            expect(v).toBeCloseTo(100, 0);
        });
    });

    describe('herschelBulkleyStress — validation', () => {
        it('throws on negative yield stress', () => {
            expect(() => modeler.herschelBulkleyStress(-1, 1, 0.5, 10)).toThrow('Yield stress must be non-negative');
        });

        it('throws on non-positive K', () => {
            expect(() => modeler.herschelBulkleyStress(0, 0, 0.5, 10)).toThrow('Consistency index must be positive');
        });

        it('throws on non-positive n', () => {
            expect(() => modeler.herschelBulkleyStress(0, 1, 0, 10)).toThrow('Flow index must be positive');
        });

        it('throws on negative shear rate', () => {
            expect(() => modeler.herschelBulkleyStress(0, 1, 0.5, -1)).toThrow('Shear rate must be non-negative');
        });

        it('returns yield stress at zero shear rate', () => {
            expect(modeler.herschelBulkleyStress(50, 1, 0.5, 0)).toBe(50);
        });

        it('reduces to power law when yield stress is 0', () => {
            const stress = modeler.herschelBulkleyStress(0, 5, 0.5, 10);
            expect(stress).toBeCloseTo(5 * Math.pow(10, 0.5), 8);
        });
    });

    describe('herschelBulkleyViscosity', () => {
        it('throws on non-positive shear rate', () => {
            expect(() => modeler.herschelBulkleyViscosity(10, 1, 0.5, 0)).toThrow('Shear rate must be positive');
        });

        it('apparent viscosity diverges as shear rate approaches 0', () => {
            const v1 = modeler.herschelBulkleyViscosity(10, 1, 0.5, 0.01);
            const v2 = modeler.herschelBulkleyViscosity(10, 1, 0.5, 1);
            expect(v1).toBeGreaterThan(v2);
        });
    });

    describe('nozzleShearRate — validation', () => {
        it('throws on non-positive flow rate', () => {
            expect(() => modeler.nozzleShearRate(0, 0.4, 1)).toThrow('Flow rate must be positive');
        });

        it('throws on non-positive nozzle diameter', () => {
            expect(() => modeler.nozzleShearRate(1, 0, 1)).toThrow('Nozzle diameter must be positive');
        });

        it('defaults n to 1 when not provided', () => {
            const sr1 = modeler.nozzleShearRate(1, 0.4, 1);
            const sr2 = modeler.nozzleShearRate(1, 0.4);
            expect(sr1).toBe(sr2);
        });

        it('Weissenberg-Rabinowitsch correction increases with lower n', () => {
            const sr_n1 = modeler.nozzleShearRate(1, 0.4, 1);
            const sr_n03 = modeler.nozzleShearRate(1, 0.4, 0.3);
            // Lower n → higher correction factor → higher apparent shear rate
            expect(sr_n03).toBeGreaterThan(sr_n1);
        });
    });

    describe('estimateFlowRate — validation', () => {
        it('throws on non-positive print speed', () => {
            expect(() => modeler.estimateFlowRate(0, 0.4, 0.2)).toThrow('Print speed must be positive');
        });

        it('throws on non-positive nozzle diameter', () => {
            expect(() => modeler.estimateFlowRate(10, 0, 0.2)).toThrow('Nozzle diameter must be positive');
        });

        it('throws on non-positive layer height', () => {
            expect(() => modeler.estimateFlowRate(10, 0.4, 0)).toThrow('Layer height must be positive');
        });

        it('flow rate scales linearly with speed', () => {
            const fr1 = modeler.estimateFlowRate(5, 0.4, 0.2);
            const fr2 = modeler.estimateFlowRate(10, 0.4, 0.2);
            expect(fr2 / fr1).toBeCloseTo(2, 8);
        });
    });

    describe('arrheniusViscosity — edge cases', () => {
        it('throws on non-positive reference viscosity', () => {
            expect(() => modeler.arrheniusViscosity(0, 25, 50, 37)).toThrow('Reference viscosity must be positive');
        });

        it('throws on non-positive activation energy', () => {
            expect(() => modeler.arrheniusViscosity(10, 25, 0, 37)).toThrow('Activation energy must be positive');
        });

        it('returns reference viscosity at reference temperature', () => {
            const v = modeler.arrheniusViscosity(10, 25, 50, 25);
            expect(v).toBeCloseTo(10, 10);
        });

        it('viscosity decreases with increasing temperature', () => {
            const v25 = modeler.arrheniusViscosity(10, 25, 50, 25);
            const v37 = modeler.arrheniusViscosity(10, 25, 50, 37);
            expect(v37).toBeLessThan(v25);
        });
    });

    describe('temperatureCurve — validation', () => {
        it('throws when minTemp >= maxTemp', () => {
            expect(() => modeler.temperatureCurve(10, 25, 50, 40, 20)).toThrow('minTemp must be less than maxTemp');
        });

        it('treats zero step as falsy and uses default', () => {
            // 0 is falsy, so step || 1 defaults to 1
            const curve = modeler.temperatureCurve(10, 25, 50, 20, 40, 0);
            expect(curve).toHaveLength(21); // 20 to 40 with step 1
        });

        it('curve length matches expected number of steps', () => {
            const curve = modeler.temperatureCurve(10, 25, 50, 20, 40, 5);
            expect(curve).toHaveLength(5); // 20, 25, 30, 35, 40
        });

        it('viscosity decreases monotonically with temperature', () => {
            const curve = modeler.temperatureCurve(10, 25, 50, 10, 50, 2);
            for (let i = 1; i < curve.length; i++) {
                expect(curve[i].viscosity).toBeLessThan(curve[i - 1].viscosity);
            }
        });
    });

    describe('analyzePrintability — edge cases', () => {
        it('throws on missing params', () => {
            expect(() => modeler.analyzePrintability()).toThrow('Parameters required');
            expect(() => modeler.analyzePrintability(null)).toThrow('Parameters required');
        });

        it('throws on missing K', () => {
            expect(() => modeler.analyzePrintability({ n: 0.5 })).toThrow('Consistency index K required');
        });

        it('throws on missing n', () => {
            expect(() => modeler.analyzePrintability({ K: 10 })).toThrow('Flow behavior index n required');
        });

        it('classifies n >= 1 as Newtonian or shear-thickening', () => {
            const r1 = modeler.analyzePrintability({ K: 10, n: 1.0 });
            expect(r1.flowBehavior).toBe('Newtonian');
            expect(r1.shearThinning).toBe(false);

            const r2 = modeler.analyzePrintability({ K: 10, n: 1.5 });
            expect(r2.flowBehavior).toBe('shear-thickening');
        });

        it('strongly shear-thinning scores higher than Newtonian', () => {
            const thin = modeler.analyzePrintability({ K: 10, n: 0.3, yieldStress: 50 });
            const newt = modeler.analyzePrintability({ K: 10, n: 1.0, yieldStress: 50 });
            expect(thin.score).toBeGreaterThan(newt.score);
        });

        it('handles high yield stress (> 500 Pa)', () => {
            const r = modeler.analyzePrintability({ K: 10, n: 0.5, yieldStress: 600 });
            const ysFactor = r.factors.find(f => f.name === 'Yield Stress');
            expect(ysFactor.status).toBe('good');
            expect(ysFactor.score).toBe(12);
        });

        it('handles zero yield stress', () => {
            const r = modeler.analyzePrintability({ K: 10, n: 0.5, yieldStress: 0 });
            const ysFactor = r.factors.find(f => f.name === 'Yield Stress');
            expect(ysFactor.status).toBe('poor');
        });

        it('handles omitted yield stress', () => {
            const r = modeler.analyzePrintability({ K: 10, n: 0.5 });
            const ysFactor = r.factors.find(f => f.name === 'Yield Stress');
            expect(ysFactor.status).toBe('unknown');
            expect(ysFactor.score).toBe(0);
        });

        it('returns printable=true for score >= 50', () => {
            const r = modeler.analyzePrintability({ K: 10, n: 0.3, yieldStress: 50 });
            expect(r.score).toBeGreaterThanOrEqual(50);
            expect(r.printable).toBe(true);
        });

        it('factors array always has 4 entries', () => {
            const r = modeler.analyzePrintability({ K: 10, n: 0.5 });
            expect(r.factors).toHaveLength(4);
        });
    });

    describe('getBioinkPresets', () => {
        it('returns 6 presets', () => {
            expect(modeler.getBioinkPresets()).toHaveLength(6);
        });

        it('all presets have required fields', () => {
            modeler.getBioinkPresets().forEach(p => {
                expect(p).toHaveProperty('id');
                expect(p).toHaveProperty('name');
                expect(p).toHaveProperty('K');
                expect(p).toHaveProperty('n');
                expect(p.K).toBeGreaterThan(0);
                expect(p.n).toBeGreaterThan(0);
                expect(p.n).toBeLessThan(1); // all should be shear-thinning
            });
        });

        it('all presets produce valid printability analyses', () => {
            modeler.getBioinkPresets().forEach(p => {
                const result = modeler.analyzePrintability(p);
                expect(result.score).toBeGreaterThanOrEqual(0);
                expect(result.score).toBeLessThanOrEqual(100);
                expect(result.shearThinning).toBe(true);
            });
        });
    });
});
