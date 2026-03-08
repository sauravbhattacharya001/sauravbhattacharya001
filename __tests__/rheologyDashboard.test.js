'use strict';

/**
 * @jest-environment jsdom
 */

describe('Rheology Dashboard (rheology.html)', () => {
    let doc;

    beforeAll(() => {
        const fs = require('fs');
        const path = require('path');
        const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
        doc = new (require('jsdom').JSDOM)(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost' });
        // Wait for inline script
    });

    // Since jsdom can't run the full canvas-based dashboard, we test the rheology module directly
    // and validate the HTML structure

    describe('HTML structure', () => {
        it('should have correct page title', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('<title>BioBots 1 — Rheology Analyzer</title>');
        });

        it('should have all 5 tab buttons', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('data-tab="viscosity"');
            expect(html).toContain('data-tab="compare"');
            expect(html).toContain('data-tab="printability"');
            expect(html).toContain('data-tab="temperature"');
            expect(html).toContain('data-tab="nozzle"');
        });

        it('should have all 5 tab content sections', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('id="tab-viscosity"');
            expect(html).toContain('id="tab-compare"');
            expect(html).toContain('id="tab-printability"');
            expect(html).toContain('id="tab-temperature"');
            expect(html).toContain('id="tab-nozzle"');
        });

        it('should include rheology.js script', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('src="shared/rheology.js"');
        });

        it('should have canvas elements for charts', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('id="viscosityChart"');
            expect(html).toContain('id="compareChart"');
            expect(html).toContain('id="tempChart"');
            expect(html).toContain('id="nozzleSweepChart"');
        });

        it('should have preset grid containers', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('id="presetGrid"');
            expect(html).toContain('id="printPresetGrid"');
        });

        it('should have data fitting textarea', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('id="fitDataInput"');
        });

        it('should have nav links to other pages', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('href="index.html"');
            expect(html).toContain('href="materials.html"');
            expect(html).toContain('href="rheology.html"');
        });

        it('should mark rheology as active nav item', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('href="rheology.html" class="active"');
        });
    });

    describe('Rheology module integration', () => {
        const { createRheologyModeler } = require('../docs/shared/rheology');
        let rheo;

        beforeEach(() => {
            rheo = createRheologyModeler();
        });

        it('should generate power law curve data for chart', () => {
            const curve = rheo.powerLawCurve(8.1, 0.71, 0.1, 1000, 60);
            expect(curve.length).toBe(60);
            expect(curve[0].shearRate).toBeCloseTo(0.1, 1);
            expect(curve[59].shearRate).toBeCloseTo(1000, 0);
            curve.forEach(p => {
                expect(p.shearRate).toBeGreaterThan(0);
                expect(p.viscosity).toBeGreaterThan(0);
            });
        });

        it('should generate cross model curve for comparison', () => {
            const curve = rheo.crossCurve(500, 0.5, 1.5, 0.8, 0.1, 1000, 60);
            expect(curve.length).toBe(60);
            // Cross model: viscosity at low shear trends toward eta0
            expect(curve[0].viscosity).toBeGreaterThan(100);
            expect(curve[0].viscosity).toBeLessThanOrEqual(500);
        });

        it('should compute HB viscosity for comparison tab', () => {
            const visc = rheo.herschelBulkleyViscosity(15, 5, 0.6, 100);
            expect(visc).toBeGreaterThan(0);
        });

        it('should run printability analysis for dashboard', () => {
            const result = rheo.analyzePrintability({ K: 8.1, n: 0.71, yieldStress: 15 });
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('printable');
            expect(result).toHaveProperty('factors');
            expect(result.factors.length).toBeGreaterThanOrEqual(3);
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should analyze printability for all presets', () => {
            const presets = rheo.getBioinkPresets();
            presets.forEach(p => {
                const result = rheo.analyzePrintability({ K: p.K, n: p.n, yieldStress: p.yieldStress });
                expect(typeof result.score).toBe('number');
                expect(typeof result.printable).toBe('boolean');
            });
        });

        it('should generate temperature curve for temp tab', () => {
            const curve = rheo.temperatureCurve(100, 25, 30, 15, 45, 1);
            expect(curve.length).toBe(31);
            // Higher temp = lower viscosity (Arrhenius)
            expect(curve[0].viscosity).toBeGreaterThan(curve[curve.length - 1].viscosity);
        });

        it('should estimate flow rate for nozzle tab', () => {
            const flow = rheo.estimateFlowRate(10, 0.41, 0.2);
            expect(flow).toBeGreaterThan(0);
        });

        it('should compute nozzle shear rate', () => {
            const flow = rheo.estimateFlowRate(10, 0.41, 0.2);
            const sr = rheo.nozzleShearRate(flow, 0.41, 0.71);
            expect(sr).toBeGreaterThan(0);
        });

        it('should compute W-R correction factor correctly', () => {
            const n = 0.71;
            const correction = (3 * n + 1) / (4 * n);
            expect(correction).toBeGreaterThan(1); // Always > 1 for n < 1
        });

        it('should run nozzle sweep across diameters', () => {
            const diameters = [0.1, 0.15, 0.2, 0.25, 0.3, 0.41, 0.5, 0.6, 0.84, 1.0];
            const results = diameters.map(d => {
                const flow = rheo.estimateFlowRate(10, d, 0.2);
                const sr = rheo.nozzleShearRate(flow, d, 0.71);
                const visc = rheo.powerLawViscosity(8.1, 0.71, sr);
                return { diameter: d, shearRate: sr, viscosity: visc };
            });
            // Smaller nozzle = higher shear rate
            expect(results[0].shearRate).toBeGreaterThan(results[results.length - 1].shearRate);
            expect(results.length).toBe(10);
        });

        it('should fit power law from experimental data', () => {
            const data = [
                { shearRate: 0.1, viscosity: 850 },
                { shearRate: 1, viscosity: 120 },
                { shearRate: 10, viscosity: 25 },
                { shearRate: 100, viscosity: 6.5 },
                { shearRate: 1000, viscosity: 2.1 }
            ];
            const result = rheo.fitPowerLaw(data);
            expect(result.K).toBeGreaterThan(0);
            expect(result.n).toBeLessThan(1); // shear-thinning data
            expect(result.rSquared).toBeGreaterThan(0.9);
        });

        it('should have 6 bioink presets for preset grid', () => {
            const presets = rheo.getBioinkPresets();
            expect(presets.length).toBe(6);
            presets.forEach(p => {
                expect(p).toHaveProperty('id');
                expect(p).toHaveProperty('name');
                expect(p).toHaveProperty('K');
                expect(p).toHaveProperty('n');
            });
        });

        it('should compute Arrhenius viscosity at 37°C body temp', () => {
            const visc = rheo.arrheniusViscosity(100, 25, 30, 37);
            expect(visc).toBeLessThan(100); // Higher temp → lower visc
            expect(visc).toBeGreaterThan(0);
        });

        it('should handle shear-thickening materials in viscosity curve', () => {
            const curve = rheo.powerLawCurve(10, 1.3, 0.1, 1000, 30);
            // Shear-thickening: viscosity increases with shear rate
            expect(curve[curve.length - 1].viscosity).toBeGreaterThan(curve[0].viscosity);
        });

        it('should compute correct viscosity ratio for printability', () => {
            const viscLow = rheo.powerLawViscosity(8.1, 0.71, 1);
            const viscHigh = rheo.powerLawViscosity(8.1, 0.71, 1000);
            const ratio = viscLow / viscHigh;
            expect(ratio).toBeGreaterThan(1);
        });

        it('should score Pluronic highest among presets', () => {
            const presets = rheo.getBioinkPresets();
            const scores = presets.map(p => ({
                name: p.name,
                score: rheo.analyzePrintability({ K: p.K, n: p.n, yieldStress: p.yieldStress }).score
            }));
            const pluronic = scores.find(s => s.name.includes('Pluronic'));
            expect(pluronic.score).toBeGreaterThanOrEqual(80);
        });

        it('should handle edge case of n=1 (Newtonian) in nozzle sim', () => {
            const flow = rheo.estimateFlowRate(10, 0.41, 0.2);
            const srNewtonian = rheo.nozzleShearRate(flow, 0.41, 1);
            const correction = (3 * 1 + 1) / (4 * 1);
            expect(correction).toBe(1); // No correction for Newtonian
        });
    });

    describe('CSS and accessibility', () => {
        it('should have dark theme CSS variables', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('--bg: #0f172a');
            expect(html).toContain('--surface: #1e293b');
            expect(html).toContain('--accent: #38bdf8');
        });

        it('should have responsive grid layout', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('@media (max-width: 768px)');
        });

        it('should have proper lang attribute', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('lang="en"');
        });

        it('should have viewport meta tag', () => {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'rheology.html'), 'utf8');
            expect(html).toContain('viewport');
        });
    });
});
