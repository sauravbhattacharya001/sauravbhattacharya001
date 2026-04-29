'use strict';

/**
 * Bioink Rheology Modeler for BioBots
 *
 * Models bioink flow behavior using standard rheological models:
 *   - Power Law (Ostwald-de Waele)
 *   - Cross model
 *   - Herschel-Bulkley
 *
 * Provides printability window analysis, temperature-viscosity modeling
 * (Arrhenius), and shear rate estimation from nozzle geometry.
 */
function createRheologyModeler() {

    /**
     * Calculate apparent viscosity using the Power Law (Ostwald-de Waele) model.
     * η = K · γ̇^(n-1)
     *
     * @param {number} K - Consistency index (Pa·s^n). Must be positive.
     * @param {number} n - Flow behavior index. n<1 = shear-thinning, n=1 = Newtonian, n>1 = shear-thickening.
     * @param {number} shearRate - Shear rate γ̇ (1/s). Must be positive.
     * @returns {number} Apparent viscosity in Pa·s.
     * @throws {Error} If parameters are non-numeric or out of valid range.
     */
    function powerLawViscosity(K, n, shearRate) {
        if (typeof K !== 'number' || typeof n !== 'number' || typeof shearRate !== 'number') {
            throw new Error('All parameters must be numbers');
        }
        if (K <= 0) throw new Error('Consistency index K must be positive');
        if (shearRate <= 0) throw new Error('Shear rate must be positive');
        return K * Math.pow(shearRate, n - 1);
    }

    /**
     * Generate a logarithmically spaced shear rate array and map each rate
     * through a viscosity function.  Shared by powerLawCurve and crossCurve
     * to eliminate duplicated log-space iteration logic.
     *
     * @param {function(number): number} viscosityFn - Maps shear rate → viscosity.
     * @param {number} minRate - Minimum shear rate (1/s). Must be positive.
     * @param {number} maxRate - Maximum shear rate (1/s). Must be > minRate.
     * @param {number} points - Number of data points (≥ 2).
     * @returns {Array<{shearRate: number, viscosity: number}>}
     */
    function _logSpacedCurve(viscosityFn, minRate, maxRate, points) {
        if (minRate <= 0 || maxRate <= 0) throw new Error('Rate bounds must be positive');
        if (minRate >= maxRate) throw new Error('minRate must be less than maxRate');
        if (points < 2) throw new Error('Need at least 2 points');

        var curve = [];
        var logMin = Math.log10(minRate);
        var logMax = Math.log10(maxRate);
        var logStep = (logMax - logMin) / (points - 1);
        for (var i = 0; i < points; i++) {
            var rate = Math.pow(10, logMin + logStep * i);
            curve.push({ shearRate: rate, viscosity: viscosityFn(rate) });
        }
        return curve;
    }

    /**
     * Generate a Power Law viscosity curve over a logarithmically spaced shear rate range.
     *
     * @param {number} K - Consistency index (Pa·s^n).
     * @param {number} n - Flow behavior index.
     * @param {number} [minRate=0.1] - Minimum shear rate (1/s).
     * @param {number} [maxRate=1000] - Maximum shear rate (1/s).
     * @param {number} [points=50] - Number of data points to generate.
     * @returns {Array<{shearRate: number, viscosity: number}>} Array of {shearRate, viscosity} objects.
     * @throws {Error} If rate bounds are invalid or fewer than 2 points requested.
     */
    function powerLawCurve(K, n, minRate, maxRate, points) {
        return _logSpacedCurve(
            function(rate) { return powerLawViscosity(K, n, rate); },
            minRate || 0.1, maxRate || 1000, points || 50
        );
    }

    /**
     * Fit Power Law parameters (K, n) to experimental shear rate–viscosity data
     * using log-linear regression.
     *
     * @param {Array<{shearRate: number, viscosity: number}>} data - Experimental data points.
     *   Must contain at least 2 points with positive shearRate and viscosity.
     * @returns {{K: number, n: number, rSquared: number}} Fitted consistency index,
     *   flow behavior index, and coefficient of determination (R²).
     * @throws {Error} If fewer than 2 valid data points are provided.
     */
    function fitPowerLaw(data) {
        if (!Array.isArray(data) || data.length < 2) {
            throw new Error('Need at least 2 data points for fitting');
        }
        var valid = data.filter(function (d) {
            return d && d.shearRate > 0 && d.viscosity > 0;
        });
        if (valid.length < 2) throw new Error('Need at least 2 valid positive data points');

        var N = valid.length;
        var sumX = 0, sumY = 0, sumXX = 0, sumXY = 0, sumYY = 0;
        // Single-pass: collect all sums needed for both regression and R²
        for (var i = 0; i < N; i++) {
            var x = Math.log(valid[i].shearRate);
            var y = Math.log(valid[i].viscosity);
            sumX += x; sumY += y; sumXX += x * x; sumXY += x * y; sumYY += y * y;
        }

        var denom = N * sumXX - sumX * sumX;
        var slope = (N * sumXY - sumX * sumY) / denom;
        var intercept = (sumY - slope * sumX) / N;
        var K = Math.exp(intercept);
        var n = slope + 1;

        // R² from sums directly: avoids second pass over the data
        // SSTotal = sumYY - (sumY²/N), SSResidual = SSTotal - slope²·(sumXX - sumX²/N)
        var ssTotal = sumYY - (sumY * sumY) / N;
        var rSquared = ssTotal > 0 ? (slope * (sumXY - sumX * sumY / N)) / ssTotal : 0;

        return { K: K, n: n, rSquared: rSquared };
    }

    /**
     * Calculate viscosity using the Cross model for shear-thinning fluids.
     * η = η∞ + (η₀ - η∞) / (1 + (λ·γ̇)^m)
     *
     * @param {number} eta0 - Zero-shear viscosity η₀ (Pa·s). Must be positive.
     * @param {number} etaInf - Infinite-shear viscosity η∞ (Pa·s). Must be non-negative and ≤ η₀.
     * @param {number} lambda - Relaxation time λ (s). Must be positive.
     * @param {number} m - Cross rate constant. Must be positive.
     * @param {number} shearRate - Shear rate γ̇ (1/s). Must be non-negative.
     * @returns {number} Apparent viscosity in Pa·s.
     * @throws {Error} If parameters are out of valid range.
     */
    function crossViscosity(eta0, etaInf, lambda, m, shearRate) {
        if (eta0 <= 0) throw new Error('Zero-shear viscosity must be positive');
        if (etaInf < 0) throw new Error('Infinite-shear viscosity must be non-negative');
        if (lambda <= 0) throw new Error('Relaxation time must be positive');
        if (m <= 0) throw new Error('Cross rate constant must be positive');
        if (shearRate < 0) throw new Error('Shear rate must be non-negative');
        if (eta0 < etaInf) throw new Error('Zero-shear viscosity must be >= infinite-shear viscosity');

        if (shearRate === 0) return eta0;
        return etaInf + (eta0 - etaInf) / (1 + Math.pow(lambda * shearRate, m));
    }

    /**
     * Generate a Cross model viscosity curve over a logarithmically spaced shear rate range.
     *
     * @param {number} eta0 - Zero-shear viscosity (Pa·s).
     * @param {number} etaInf - Infinite-shear viscosity (Pa·s).
     * @param {number} lambda - Relaxation time (s).
     * @param {number} m - Cross rate constant.
     * @param {number} [minRate=0.01] - Minimum shear rate (1/s).
     * @param {number} [maxRate=10000] - Maximum shear rate (1/s).
     * @param {number} [points=50] - Number of data points.
     * @returns {Array<{shearRate: number, viscosity: number}>} Curve data points.
     */
    function crossCurve(eta0, etaInf, lambda, m, minRate, maxRate, points) {
        return _logSpacedCurve(
            function(rate) { return crossViscosity(eta0, etaInf, lambda, m, rate); },
            minRate || 0.01, maxRate || 10000, points || 50
        );
    }

    /**
     * Calculate shear stress using the Herschel-Bulkley model.
     * τ = τ₀ + K · γ̇^n
     *
     * @param {number} yieldStress - Yield stress τ₀ (Pa). Must be non-negative.
     * @param {number} K - Consistency index (Pa·s^n). Must be positive.
     * @param {number} n - Flow index. Must be positive.
     * @param {number} shearRate - Shear rate γ̇ (1/s). Must be non-negative.
     * @returns {number} Shear stress in Pa.
     * @throws {Error} If parameters are out of valid range.
     */
    function herschelBulkleyStress(yieldStress, K, n, shearRate) {
        if (yieldStress < 0) throw new Error('Yield stress must be non-negative');
        if (K <= 0) throw new Error('Consistency index must be positive');
        if (n <= 0) throw new Error('Flow index must be positive');
        if (shearRate < 0) throw new Error('Shear rate must be non-negative');
        return yieldStress + K * Math.pow(shearRate, n);
    }

    /**
     * Calculate apparent viscosity using the Herschel-Bulkley model.
     * η = τ / γ̇ = (τ₀ + K · γ̇^n) / γ̇
     *
     * @param {number} yieldStress - Yield stress τ₀ (Pa).
     * @param {number} K - Consistency index (Pa·s^n).
     * @param {number} n - Flow index.
     * @param {number} shearRate - Shear rate γ̇ (1/s). Must be positive.
     * @returns {number} Apparent viscosity in Pa·s.
     * @throws {Error} If shear rate is not positive.
     */
    function herschelBulkleyViscosity(yieldStress, K, n, shearRate) {
        if (shearRate <= 0) throw new Error('Shear rate must be positive for viscosity calculation');
        var stress = herschelBulkleyStress(yieldStress, K, n, shearRate);
        return stress / shearRate;
    }

    /**
     * Estimate wall shear rate inside a cylindrical nozzle using the
     * Rabinowitsch–Mooney correction for non-Newtonian fluids.
     *
     * γ̇_wall = ((3n+1)/(4n)) · (32Q / (πD³))
     *
     * @param {number} flowRate - Volumetric flow rate (mL/min). Must be positive.
     * @param {number} nozzleDiameter - Nozzle inner diameter (mm). Must be positive.
     * @param {number} [n=1] - Flow behavior index for Rabinowitsch correction.
     * @returns {number} Estimated wall shear rate (1/s).
     * @throws {Error} If flowRate or nozzleDiameter are not positive.
     */
    function nozzleShearRate(flowRate, nozzleDiameter, n) {
        if (flowRate <= 0) throw new Error('Flow rate must be positive');
        if (nozzleDiameter <= 0) throw new Error('Nozzle diameter must be positive');
        n = (typeof n === 'number' && n > 0) ? n : 1;

        var Q = flowRate * 1e-6 / 60;
        var D = nozzleDiameter * 1e-3;

        var newtonian = 32 * Q / (Math.PI * Math.pow(D, 3));
        var correction = (3 * n + 1) / (4 * n);
        return correction * newtonian;
    }

    /**
     * Estimate volumetric flow rate from print parameters assuming a
     * rectangular cross-section filament (width = nozzle diameter).
     *
     * @param {number} printSpeed - Linear print speed (mm/s). Must be positive.
     * @param {number} nozzleDiameter - Nozzle diameter (mm). Must be positive.
     * @param {number} layerHeight - Layer height (mm). Must be positive.
     * @returns {number} Estimated flow rate in mL/min.
     * @throws {Error} If any parameter is not positive.
     */
    function estimateFlowRate(printSpeed, nozzleDiameter, layerHeight) {
        if (printSpeed <= 0) throw new Error('Print speed must be positive');
        if (nozzleDiameter <= 0) throw new Error('Nozzle diameter must be positive');
        if (layerHeight <= 0) throw new Error('Layer height must be positive');

        var area = nozzleDiameter * layerHeight;
        var volumeRate = printSpeed * area;
        return volumeRate * 60 / 1000;
    }

    /**
     * Predict viscosity at a target temperature using the Arrhenius equation.
     * η(T) = η_ref · exp((Ea/R) · (1/T - 1/T_ref))
     *
     * @param {number} refViscosity - Viscosity at reference temperature (Pa·s). Must be positive.
     * @param {number} refTemp - Reference temperature (°C).
     * @param {number} activationEnergy - Flow activation energy (kJ/mol). Must be positive.
     * @param {number} targetTemp - Target temperature (°C).
     * @returns {number} Predicted viscosity at target temperature (Pa·s).
     * @throws {Error} If temperatures are below absolute zero or parameters invalid.
     */
    function arrheniusViscosity(refViscosity, refTemp, activationEnergy, targetTemp) {
        if (refViscosity <= 0) throw new Error('Reference viscosity must be positive');
        if (activationEnergy <= 0) throw new Error('Activation energy must be positive');

        var R = 8.314e-3;
        var T_ref = refTemp + 273.15;
        var T_target = targetTemp + 273.15;

        if (T_ref <= 0 || T_target <= 0) throw new Error('Temperature must be above absolute zero');

        var exponent = (activationEnergy / R) * (1 / T_target - 1 / T_ref);
        return refViscosity * Math.exp(exponent);
    }

    /**
     * Generate an Arrhenius temperature–viscosity curve over a linear temperature range.
     *
     * @param {number} refViscosity - Viscosity at reference temperature (Pa·s).
     * @param {number} refTemp - Reference temperature (°C).
     * @param {number} activationEnergy - Flow activation energy (kJ/mol).
     * @param {number} minTemp - Minimum temperature (°C).
     * @param {number} maxTemp - Maximum temperature (°C).
     * @param {number} [step=1] - Temperature step size (°C).
     * @returns {Array<{temperature: number, viscosity: number}>} Curve data points.
     * @throws {Error} If minTemp ≥ maxTemp or step ≤ 0.
     */
    function temperatureCurve(refViscosity, refTemp, activationEnergy, minTemp, maxTemp, step) {
        step = step || 1;
        if (minTemp >= maxTemp) throw new Error('minTemp must be less than maxTemp');
        if (step <= 0) throw new Error('Step must be positive');

        var curve = [];
        for (var T = minTemp; T <= maxTemp; T += step) {
            curve.push({ temperature: T, viscosity: arrheniusViscosity(refViscosity, refTemp, activationEnergy, T) });
        }
        return curve;
    }

    /**
     * Evaluate bioink printability based on rheological parameters.
     * Scores shear-thinning behavior, viscosity at print shear rate,
     * viscosity ratio (low vs high shear), and yield stress.
     *
     * @param {Object} params - Rheological parameters.
     * @param {number} params.K - Consistency index (Pa·s^n). Required, must be positive.
     * @param {number} params.n - Flow behavior index. Required.
     * @param {number} [params.yieldStress] - Yield stress (Pa).
     * @param {number} [params.printShearRate=100] - Shear rate during printing (1/s).
     * @param {number} [params.minViscosity=1] - Lower bound of optimal viscosity window (Pa·s).
     * @param {number} [params.maxViscosity=1000] - Upper bound of optimal viscosity window (Pa·s).
     * @returns {{printable: boolean, score: number, factors: Array, viscosityAtPrint: number,
     *   shearThinning: boolean, flowBehavior: string}} Printability assessment with 0-100 score.
     * @throws {Error} If required parameters are missing or invalid.
     */
    function analyzePrintability(params) {
        if (!params || typeof params !== 'object') throw new Error('Parameters required');
        if (!params.K || params.K <= 0) throw new Error('Consistency index K required and must be positive');
        if (typeof params.n !== 'number') throw new Error('Flow behavior index n required');

        var printRate = params.printShearRate || 100;
        var minVisc = params.minViscosity || 1;
        var maxVisc = params.maxViscosity || 1000;

        var viscAtPrint = powerLawViscosity(params.K, params.n, printRate);
        var factors = [];
        var totalScore = 0;
        var maxScore = 0;

        maxScore += 25;
        if (params.n < 0.5) {
            factors.push({ name: 'Shear Thinning', score: 25, max: 25, status: 'excellent', detail: 'Strong shear-thinning (n=' + params.n.toFixed(2) + ')' });
            totalScore += 25;
        } else if (params.n < 0.8) {
            factors.push({ name: 'Shear Thinning', score: 20, max: 25, status: 'good', detail: 'Moderate shear-thinning (n=' + params.n.toFixed(2) + ')' });
            totalScore += 20;
        } else if (params.n < 1.0) {
            factors.push({ name: 'Shear Thinning', score: 10, max: 25, status: 'marginal', detail: 'Mild shear-thinning (n=' + params.n.toFixed(2) + ')' });
            totalScore += 10;
        } else {
            factors.push({ name: 'Shear Thinning', score: 0, max: 25, status: 'poor', detail: 'Not shear-thinning (n=' + params.n.toFixed(2) + ')' });
        }

        maxScore += 30;
        if (viscAtPrint >= minVisc && viscAtPrint <= maxVisc) {
            var optRange = maxVisc - minVisc;
            var optCenter = (minVisc + maxVisc) / 2;
            var dist = Math.abs(viscAtPrint - optCenter) / (optRange / 2);
            var viscScore = Math.round(30 * Math.max(0, 1 - dist * 0.5));
            factors.push({ name: 'Print Viscosity', score: viscScore, max: 30, status: viscScore >= 20 ? 'excellent' : 'good', detail: 'Viscosity at print rate: ' + viscAtPrint.toFixed(1) + ' Pa·s' });
            totalScore += viscScore;
        } else if (viscAtPrint < minVisc) {
            factors.push({ name: 'Print Viscosity', score: 5, max: 30, status: 'poor', detail: 'Too low (' + viscAtPrint.toFixed(1) + ' Pa·s)' });
            totalScore += 5;
        } else {
            factors.push({ name: 'Print Viscosity', score: 5, max: 30, status: 'poor', detail: 'Too high (' + viscAtPrint.toFixed(1) + ' Pa·s)' });
            totalScore += 5;
        }

        maxScore += 25;
        var viscLow = powerLawViscosity(params.K, params.n, 1);
        var viscHigh = powerLawViscosity(params.K, params.n, 1000);
        var ratio = viscLow / viscHigh;
        if (ratio >= 100) {
            factors.push({ name: 'Viscosity Ratio', score: 25, max: 25, status: 'excellent', detail: 'High ratio (' + ratio.toFixed(0) + 'x)' });
            totalScore += 25;
        } else if (ratio >= 10) {
            var ratioScore = Math.round(15 + 10 * (Math.log10(ratio) - 1));
            factors.push({ name: 'Viscosity Ratio', score: ratioScore, max: 25, status: 'good', detail: 'Moderate ratio (' + ratio.toFixed(0) + 'x)' });
            totalScore += ratioScore;
        } else {
            factors.push({ name: 'Viscosity Ratio', score: 5, max: 25, status: 'marginal', detail: 'Low ratio (' + ratio.toFixed(1) + 'x)' });
            totalScore += 5;
        }

        maxScore += 20;
        if (typeof params.yieldStress === 'number') {
            if (params.yieldStress >= 10 && params.yieldStress <= 500) {
                factors.push({ name: 'Yield Stress', score: 20, max: 20, status: 'excellent', detail: 'Yield stress ' + params.yieldStress.toFixed(1) + ' Pa — good shape retention' });
                totalScore += 20;
            } else if (params.yieldStress > 0 && params.yieldStress < 10) {
                factors.push({ name: 'Yield Stress', score: 10, max: 20, status: 'marginal', detail: 'Low yield stress (' + params.yieldStress.toFixed(1) + ' Pa)' });
                totalScore += 10;
            } else if (params.yieldStress > 500) {
                factors.push({ name: 'Yield Stress', score: 12, max: 20, status: 'good', detail: 'High yield stress (' + params.yieldStress.toFixed(0) + ' Pa)' });
                totalScore += 12;
            } else {
                factors.push({ name: 'Yield Stress', score: 5, max: 20, status: 'poor', detail: 'No yield stress' });
                totalScore += 5;
            }
        } else {
            factors.push({ name: 'Yield Stress', score: 0, max: 20, status: 'unknown', detail: 'Yield stress not provided' });
        }

        var score = Math.round(100 * totalScore / maxScore);

        return {
            printable: score >= 50,
            score: score,
            factors: factors,
            viscosityAtPrint: viscAtPrint,
            shearThinning: params.n < 1,
            flowBehavior: params.n < 0.5 ? 'strongly shear-thinning' : params.n < 1.0 ? 'shear-thinning' : params.n === 1.0 ? 'Newtonian' : 'shear-thickening'
        };
    }

    /**
     * Get a curated set of common bioink rheology presets with published parameters.
     * Each preset includes Power Law parameters (K, n), yield stress, recommended
     * temperature range, and literature citation.
     *
     * @returns {Array<{id: string, name: string, K: number, n: number, yieldStress: number,
     *   tempRange: number[], description: string, citation: string}>} Array of bioink presets.
     */
    function getBioinkPresets() {
        return [
            { id: 'gelma-5pct', name: 'GelMA 5%', K: 2.5, n: 0.62, yieldStress: 15, tempRange: [20, 37], description: 'Gelatin methacrylate 5% w/v, photocrosslinkable', citation: 'Loessner et al., Nat. Protoc. 2016' },
            { id: 'alginate-3pct', name: 'Alginate 3%', K: 8.1, n: 0.71, yieldStress: 5, tempRange: [20, 40], description: 'Sodium alginate 3% w/v, CaCl2 crosslinked', citation: 'Axpe & Oyen, Int. J. Mol. Sci. 2016' },
            { id: 'collagen-6mg', name: 'Collagen 6mg/mL', K: 0.8, n: 0.45, yieldStress: 3, tempRange: [4, 25], description: 'Type I collagen 6 mg/mL, thermally gelled', citation: 'Lee et al., Biomaterials 2019' },
            { id: 'pluronic-25pct', name: 'Pluronic F-127 25%', K: 45, n: 0.35, yieldStress: 120, tempRange: [25, 40], description: 'Pluronic F-127 25% w/v, thermoreversible', citation: 'Mueller et al., J. Vis. Exp. 2013' },
            { id: 'ha-bioink', name: 'Hyaluronic Acid 2%', K: 15, n: 0.55, yieldStress: 25, tempRange: [20, 37], description: 'Hyaluronic acid 2% w/v, methacrylated', citation: 'Highley et al., Adv. Mater. 2015' },
            { id: 'silk-5pct', name: 'Silk Fibroin 5%', K: 3.2, n: 0.58, yieldStress: 8, tempRange: [20, 37], description: 'Silk fibroin 5% w/v, enzymatically crosslinked', citation: 'Das et al., Acta Biomater. 2015' }
        ];
    }

    return {
        powerLawViscosity: powerLawViscosity,
        powerLawCurve: powerLawCurve,
        fitPowerLaw: fitPowerLaw,
        crossViscosity: crossViscosity,
        crossCurve: crossCurve,
        herschelBulkleyStress: herschelBulkleyStress,
        herschelBulkleyViscosity: herschelBulkleyViscosity,
        nozzleShearRate: nozzleShearRate,
        estimateFlowRate: estimateFlowRate,
        arrheniusViscosity: arrheniusViscosity,
        temperatureCurve: temperatureCurve,
        analyzePrintability: analyzePrintability,
        getBioinkPresets: getBioinkPresets
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createRheologyModeler: createRheologyModeler };
}
