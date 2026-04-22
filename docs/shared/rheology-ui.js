(function() {
        'use strict';

        var _escMap = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
        var _escRe = /[&<>"']/g;
        function esc(s) { return String(s).replace(_escRe, function(c) { return _escMap[c]; }); }

        // Apply dynamic styles from data- attributes (CSP-safe: avoids inline style=)
        function applyDynStyles(root) {
            var els = (root || document).querySelectorAll('[data-bg]');
            for (var i = 0; i < els.length; i++) {
                els[i].style.background = els[i].getAttribute('data-bg');
            }
            var fills = (root || document).querySelectorAll('[data-width]');
            for (var j = 0; j < fills.length; j++) {
                fills[j].style.width = fills[j].getAttribute('data-width');
            }
        }

        var rheo = createRheologyModeler();
        var presets = rheo.getBioinkPresets();

        // ── Chart helpers (vanilla Canvas) ──────────────────────

        var COLORS = ['#38bdf8', '#4ade80', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171'];

        function clearCanvas(canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        function drawLogLogChart(canvas, datasets, opts) {
            var rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';

            var ctx = canvas.getContext('2d');
            var dpr = window.devicePixelRatio || 1;
            ctx.scale(dpr, dpr);

            var w = rect.width, h = rect.height;
            var pad = { top: 30, right: 30, bottom: 50, left: 70 };
            var pw = w - pad.left - pad.right;
            var ph = h - pad.top - pad.bottom;

            // Find data range
            var allX = [], allY = [];
            datasets.forEach(function(ds) {
                ds.data.forEach(function(p) { allX.push(p.x); allY.push(p.y); });
            });

            var useLog = opts && opts.logX !== false;
            var useLogY = opts && opts.logY !== false;

            var xMin, xMax, yMin, yMax;
            if (useLog) {
                xMin = Math.floor(Math.log10(Math.min.apply(null, allX)));
                xMax = Math.ceil(Math.log10(Math.max.apply(null, allX)));
            } else {
                xMin = Math.min.apply(null, allX);
                xMax = Math.max.apply(null, allX);
            }
            if (useLogY) {
                yMin = Math.floor(Math.log10(Math.max(0.001, Math.min.apply(null, allY))));
                yMax = Math.ceil(Math.log10(Math.max.apply(null, allY)));
            } else {
                yMin = Math.min.apply(null, allY);
                yMax = Math.max.apply(null, allY) * 1.1;
            }

            function mapX(v) {
                var val = useLog ? Math.log10(v) : v;
                var min = useLog ? xMin : xMin;
                var max = useLog ? xMax : xMax;
                return pad.left + pw * (val - min) / (max - min);
            }

            function mapY(v) {
                var val = useLogY ? Math.log10(Math.max(0.001, v)) : v;
                var min = useLogY ? yMin : yMin;
                var max = useLogY ? yMax : yMax;
                return pad.top + ph * (1 - (val - min) / (max - min));
            }

            // Grid
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.font = '11px -apple-system, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';

            // X axis ticks
            if (useLog) {
                for (var i = xMin; i <= xMax; i++) {
                    var x = mapX(Math.pow(10, i));
                    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
                    ctx.fillText('10^' + i, x, h - pad.bottom + 20);
                }
            } else {
                var xStep = (xMax - xMin) / 5;
                for (var xi = xMin; xi <= xMax; xi += xStep) {
                    var xx = mapX(xi);
                    ctx.beginPath(); ctx.moveTo(xx, pad.top); ctx.lineTo(xx, pad.top + ph); ctx.stroke();
                    ctx.fillText(xi.toFixed(0), xx, h - pad.bottom + 20);
                }
            }

            // Y axis ticks
            ctx.textAlign = 'right';
            if (useLogY) {
                for (var j = yMin; j <= yMax; j++) {
                    var y = mapY(Math.pow(10, j));
                    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
                    ctx.fillText('10^' + j, pad.left - 8, y + 4);
                }
            } else {
                var yStep = (yMax - yMin) / 5;
                for (var yi = yMin; yi <= yMax; yi += yStep) {
                    var yy = mapY(yi);
                    ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(pad.left + pw, yy); ctx.stroke();
                    ctx.fillText(yi.toFixed(1), pad.left - 8, yy + 4);
                }
            }

            // Axis labels
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText(opts && opts.xLabel || 'Shear Rate (1/s)', pad.left + pw / 2, h - 5);
            ctx.save();
            ctx.translate(15, pad.top + ph / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(opts && opts.yLabel || 'Viscosity (Pa·s)', 0, 0);
            ctx.restore();

            // Border
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(pad.left, pad.top, pw, ph);

            // Data lines
            datasets.forEach(function(ds, idx) {
                ctx.strokeStyle = ds.color || COLORS[idx % COLORS.length];
                ctx.lineWidth = 2;
                ctx.beginPath();
                ds.data.forEach(function(p, i) {
                    var px = mapX(p.x), py = mapY(p.y);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                });
                ctx.stroke();

                // Points
                if (ds.data.length <= 30) {
                    ctx.fillStyle = ds.color || COLORS[idx % COLORS.length];
                    ds.data.forEach(function(p) {
                        var px = mapX(p.x), py = mapY(p.y);
                        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
                    });
                }
            });
        }

        // ── Tab switching ───────────────────────────────────────

        document.getElementById('mainTabs').addEventListener('click', function(e) {
            if (!e.target.classList.contains('tab-btn')) return;
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
            e.target.classList.add('active');
            document.getElementById('tab-' + e.target.dataset.tab).classList.add('active');
        });

        // ── Presets ─────────────────────────────────────────────

        function renderPresets(containerId, onClick) {
            var container = document.getElementById(containerId);
            container.innerHTML = '';
            presets.forEach(function(p) {
                var div = document.createElement('div');
                div.className = 'preset-card';
                div.dataset.id = p.id;
                div.innerHTML = '<h4>' + esc(p.name) + '</h4><p>K=' + esc(p.K) + ', n=' + esc(p.n) +
                    (p.yieldStress ? ', τ_y=' + esc(p.yieldStress) + ' Pa' : '') + '</p>' +
                    '<p>' + esc(p.description) + '</p>';
                div.addEventListener('click', function() {
                    container.querySelectorAll('.preset-card').forEach(function(c) { c.classList.remove('selected'); });
                    div.classList.add('selected');
                    onClick(p);
                });
                container.appendChild(div);
            });
        }

        renderPresets('presetGrid', function(p) {
            document.getElementById('plK').value = p.K;
            document.getElementById('plN').value = p.n;
        });

        renderPresets('printPresetGrid', function(p) {
            document.getElementById('prK').value = p.K;
            document.getElementById('prN').value = p.n;
            document.getElementById('prYield').value = p.yieldStress || '';
        });

        // ── Tab 1: Viscosity curves ─────────────────────────────

        var viscOverlays = [];

        function plotViscosityCurve() {
            viscOverlays = [];
            addViscosityCurve(true);
        }

        function addOverlayCurve() {
            addViscosityCurve(false);
        }

        function clearOverlays() {
            viscOverlays = [];
            clearCanvas(document.getElementById('viscosityChart'));
            document.getElementById('viscosityLegend').innerHTML = '';
            document.getElementById('viscosityStats').innerHTML = '';
        }

        function addViscosityCurve(reset) {
            var K = parseFloat(document.getElementById('plK').value);
            var n = parseFloat(document.getElementById('plN').value);
            var minR = parseFloat(document.getElementById('plMinRate').value);
            var maxR = parseFloat(document.getElementById('plMaxRate').value);

            try {
                var curve = rheo.powerLawCurve(K, n, minR, maxR, 60);
                var data = curve.map(function(p) { return { x: p.shearRate, y: p.viscosity }; });
                var label = 'K=' + K + ', n=' + n;
                var color = COLORS[reset ? 0 : viscOverlays.length % COLORS.length];

                if (reset) viscOverlays = [];
                viscOverlays.push({ data: data, color: color, label: label, K: K, n: n });

                drawLogLogChart(document.getElementById('viscosityChart'), viscOverlays);

                // Legend
                var legendEl = document.getElementById('viscosityLegend');
                legendEl.innerHTML = '';
                viscOverlays.forEach(function(o) {
                    legendEl.innerHTML += '<div class="legend-item"><div class="legend-dot" data-bg="' + esc(o.color) + '"></div>' + esc(o.label) + '</div>';
                });
                applyDynStyles(legendEl);

                // Stats for latest
                var viscAt1 = rheo.powerLawViscosity(K, n, 1);
                var viscAt100 = rheo.powerLawViscosity(K, n, 100);
                var viscAt1000 = rheo.powerLawViscosity(K, n, 1000);
                var behavior = n < 0.5 ? 'Strongly shear-thinning' : n < 1 ? 'Shear-thinning' : n === 1 ? 'Newtonian' : 'Shear-thickening';

                document.getElementById('viscosityStats').innerHTML =
                    '<div class="stat-card"><div class="stat-value">' + viscAt1.toFixed(1) + '</div><div class="stat-label">η @ 1 s⁻¹ (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + viscAt100.toFixed(2) + '</div><div class="stat-label">η @ 100 s⁻¹ (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + viscAt1000.toFixed(3) + '</div><div class="stat-label">η @ 1000 s⁻¹ (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + (viscAt1 / viscAt1000).toFixed(0) + 'x</div><div class="stat-label">Shear Thinning Ratio</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + behavior + '</div><div class="stat-label">Flow Behavior</div></div>';
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }

        // ── Fit Power Law ───────────────────────────────────────

        function fitData() {
            var raw = document.getElementById('fitDataInput').value.trim();
            if (!raw) return;

            var lines = raw.split('\n').filter(function(l) { return l.trim() && !l.trim().startsWith('#'); });
            var data = [];
            lines.forEach(function(l) {
                var parts = l.split(/[,\t\s]+/).map(Number);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    data.push({ shearRate: parts[0], viscosity: parts[1] });
                }
            });

            if (data.length < 2) {
                document.getElementById('fitResults').innerHTML = '<p class="error-msg">Need at least 2 valid data points.</p>';
                return;
            }

            try {
                var result = rheo.fitPowerLaw(data);
                document.getElementById('fitResults').innerHTML =
                    '<div class="stats-grid stats-grid-mt">' +
                    '<div class="stat-card"><div class="stat-value">' + result.K.toFixed(3) + '</div><div class="stat-label">K (Pa·sⁿ)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + result.n.toFixed(4) + '</div><div class="stat-label">n (flow index)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + result.rSquared.toFixed(4) + '</div><div class="stat-label">R²</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + data.length + '</div><div class="stat-label">Data Points</div></div>' +
                    '</div>' +
                    '<div class="btn-group btn-group-mt"><button class="btn btn-outline" id="btnUseFitResult" data-k="' + result.K + '" data-n="' + result.n + '">Use These Parameters</button></div>';

                // Wire the dynamic "Use These Parameters" button
                setTimeout(function() {
                    var useBtn = document.getElementById('btnUseFitResult');
                    if (useBtn) {
                        useBtn.addEventListener('click', function() {
                            useFitResult(parseFloat(this.dataset.k), parseFloat(this.dataset.n));
                        });
                    }
                }, 0);
            } catch (e) {
                document.getElementById('fitResults').innerHTML = '<p class="error-msg">' + esc(e.message) + '</p>';
            }
        }

        function useFitResult(K, n) {
            document.getElementById('plK').value = K.toFixed(3);
            document.getElementById('plN').value = n.toFixed(4);
            plotViscosityCurve();
        }

        // ── Tab 2: Model Comparison ─────────────────────────────

        function plotModelComparison() {
            var plK = parseFloat(document.getElementById('cmpPL_K').value);
            var plN = parseFloat(document.getElementById('cmpPL_n').value);
            var eta0 = parseFloat(document.getElementById('cmpCross_eta0').value);
            var etaInf = parseFloat(document.getElementById('cmpCross_etaInf').value);
            var lambda = parseFloat(document.getElementById('cmpCross_lambda').value);
            var m = parseFloat(document.getElementById('cmpCross_m').value);
            var hbYield = parseFloat(document.getElementById('cmpHB_yield').value);
            var hbK = parseFloat(document.getElementById('cmpHB_K').value);
            var hbN = parseFloat(document.getElementById('cmpHB_n').value);

            try {
                var plCurve = rheo.powerLawCurve(plK, plN, 0.1, 1000, 60);
                var crCurve = rheo.crossCurve(eta0, etaInf, lambda, m, 0.1, 1000, 60);

                var hbData = [];
                for (var i = 0; i < 60; i++) {
                    var logRate = -1 + 4 * i / 59;
                    var rate = Math.pow(10, logRate);
                    hbData.push({ shearRate: rate, viscosity: rheo.herschelBulkleyViscosity(hbYield, hbK, hbN, rate) });
                }

                var datasets = [
                    { data: plCurve.map(function(p) { return { x: p.shearRate, y: p.viscosity }; }), color: COLORS[0], label: 'Power Law' },
                    { data: crCurve.map(function(p) { return { x: p.shearRate, y: p.viscosity }; }), color: COLORS[1], label: 'Cross Model' },
                    { data: hbData.map(function(p) { return { x: p.shearRate, y: p.viscosity }; }), color: COLORS[2], label: 'Herschel-Bulkley' }
                ];

                drawLogLogChart(document.getElementById('compareChart'), datasets);

                // Comparison table at key shear rates
                var rates = [0.1, 1, 10, 100, 1000];
                var html = '<table class="data-table"><thead><tr><th>γ̇ (1/s)</th><th>Power Law (Pa·s)</th><th>Cross (Pa·s)</th><th>H-B (Pa·s)</th></tr></thead><tbody>';
                rates.forEach(function(r) {
                    var vPL = rheo.powerLawViscosity(plK, plN, r);
                    var vCr = rheo.crossViscosity(eta0, etaInf, lambda, m, r);
                    var vHB = rheo.herschelBulkleyViscosity(hbYield, hbK, hbN, r);
                    html += '<tr><td>' + r + '</td><td>' + vPL.toFixed(2) + '</td><td>' + vCr.toFixed(2) + '</td><td>' + vHB.toFixed(2) + '</td></tr>';
                });
                html += '</tbody></table>';
                document.getElementById('compareTable').innerHTML = html;
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }

        // ── Tab 3: Printability ─────────────────────────────────

        function runPrintability() {
            var K = parseFloat(document.getElementById('prK').value);
            var n = parseFloat(document.getElementById('prN').value);
            var yieldS = parseFloat(document.getElementById('prYield').value);
            var shearRate = parseFloat(document.getElementById('prShearRate').value);

            try {
                var result = rheo.analyzePrintability({
                    K: K, n: n,
                    yieldStress: isNaN(yieldS) ? undefined : yieldS,
                    printShearRate: shearRate
                });

                var scoreClass = result.score >= 80 ? 'excellent' : result.score >= 60 ? 'good' : result.score >= 40 ? 'marginal' : 'poor';

                var html = '<div class="result-section result-section-mt">';
                html += '<div class="text-center"><div class="score-badge score-' + scoreClass + '">' + result.score + '</div>';
                html += '<div class="print-status">' + (result.printable ? '✅ Printable' : '❌ Not Printable') + '</div>';
                html += '<div class="print-behavior">' + result.flowBehavior + '</div></div>';

                html += '<div>';
                result.factors.forEach(function(f) {
                    var pct = Math.round(100 * f.score / f.max);
                    var barColor = f.status === 'excellent' ? 'var(--success)' : f.status === 'good' ? 'var(--accent)' : f.status === 'marginal' ? 'var(--warning)' : f.status === 'poor' ? 'var(--error)' : 'var(--muted)';
                    html += '<div class="factor-bar"><span class="factor-name">' + f.name + '</span>';
                    html += '<div class="factor-track"><div class="factor-fill" data-width="' + pct + '%" data-bg="' + barColor + '"></div></div>';
                    html += '<span class="factor-score">' + f.score + '/' + f.max + '</span>';
                    html += '<span class="tag tag-' + f.status + '">' + f.status + '</span></div>';
                    html += '<div class="factor-detail">' + f.detail + '</div>';
                });

                html += '<div class="stat-card stat-card-mt"><div class="stat-value">' + result.viscosityAtPrint.toFixed(2) + ' Pa·s</div><div class="stat-label">Viscosity at Print Shear Rate</div></div>';
                html += '</div></div>';

                document.getElementById('printResults').innerHTML = html;
                applyDynStyles(document.getElementById('printResults'));
            } catch (e) {
                document.getElementById('printResults').innerHTML = '<p class="error-msg">' + esc(e.message) + '</p>';
            }
        }

        function compareAllPresets() {
            var html = '<table class="data-table"><thead><tr><th>Bioink</th><th>K</th><th>n</th><th>τ_y</th><th>Score</th><th>Printable</th><th>Behavior</th></tr></thead><tbody>';
            presets.forEach(function(p) {
                var result = rheo.analyzePrintability({ K: p.K, n: p.n, yieldStress: p.yieldStress });
                var scoreClass = result.score >= 80 ? 'excellent' : result.score >= 60 ? 'good' : result.score >= 40 ? 'marginal' : 'poor';
                html += '<tr><td><strong>' + p.name + '</strong></td><td>' + p.K + '</td><td>' + p.n + '</td><td>' + (p.yieldStress || '—') + '</td>';
                html += '<td><span class="tag tag-' + scoreClass + '">' + result.score + '</span></td>';
                html += '<td>' + (result.printable ? '✅' : '❌') + '</td>';
                html += '<td>' + result.flowBehavior + '</td></tr>';
            });
            html += '</tbody></table>';
            document.getElementById('presetComparisonTable').innerHTML = html;
        }

        // ── Tab 4: Temperature ──────────────────────────────────

        var tempOverlays = [];

        function plotTempCurve() {
            tempOverlays = [];
            addTempCurveInternal(true);
        }

        function addTempOverlay() {
            addTempCurveInternal(false);
        }

        function clearTempOverlays() {
            tempOverlays = [];
            clearCanvas(document.getElementById('tempChart'));
            document.getElementById('tempLegend').innerHTML = '';
            document.getElementById('tempStats').innerHTML = '';
        }

        function addTempCurveInternal(reset) {
            var refVisc = parseFloat(document.getElementById('tempRefVisc').value);
            var refTemp = parseFloat(document.getElementById('tempRefTemp').value);
            var ea = parseFloat(document.getElementById('tempEa').value);
            var minT = parseFloat(document.getElementById('tempMin').value);
            var maxT = parseFloat(document.getElementById('tempMax').value);

            try {
                var curve = rheo.temperatureCurve(refVisc, refTemp, ea, minT, maxT, 1);
                var data = curve.map(function(p) { return { x: p.temperature, y: p.viscosity }; });
                var label = 'η_ref=' + refVisc + ', Ea=' + ea + ' kJ/mol';
                var color = COLORS[reset ? 0 : tempOverlays.length % COLORS.length];

                if (reset) tempOverlays = [];
                tempOverlays.push({ data: data, color: color, label: label });

                drawLogLogChart(document.getElementById('tempChart'), tempOverlays, {
                    logX: false, logY: true,
                    xLabel: 'Temperature (°C)',
                    yLabel: 'Viscosity (Pa·s)'
                });

                // Legend
                var legendEl = document.getElementById('tempLegend');
                legendEl.innerHTML = '';
                tempOverlays.forEach(function(o) {
                    legendEl.innerHTML += '<div class="legend-item"><div class="legend-dot" data-bg="' + esc(o.color) + '"></div>' + esc(o.label) + '</div>';
                });
                applyDynStyles(legendEl);

                // Stats
                var viscMin = rheo.arrheniusViscosity(refVisc, refTemp, ea, minT);
                var viscMax = rheo.arrheniusViscosity(refVisc, refTemp, ea, maxT);
                var visc37 = rheo.arrheniusViscosity(refVisc, refTemp, ea, 37);

                document.getElementById('tempStats').innerHTML =
                    '<div class="stat-card"><div class="stat-value">' + viscMin.toFixed(1) + '</div><div class="stat-label">η @ ' + minT + '°C (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + visc37.toFixed(1) + '</div><div class="stat-label">η @ 37°C (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + viscMax.toFixed(1) + '</div><div class="stat-label">η @ ' + maxT + '°C (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + (viscMin / viscMax).toFixed(1) + 'x</div><div class="stat-label">Temp Sensitivity</div></div>';
            } catch (e) {
                alert('Error: ' + e.message);
            }
        }

        // ── Tab 5: Nozzle Simulator ─────────────────────────────

        function runNozzleSim() {
            var speed = parseFloat(document.getElementById('nzSpeed').value);
            var dia = parseFloat(document.getElementById('nzDiameter').value);
            var layerH = parseFloat(document.getElementById('nzLayerH').value);
            var n = parseFloat(document.getElementById('nzN').value);
            var K = parseFloat(document.getElementById('nzK').value);

            try {
                var flowRate = rheo.estimateFlowRate(speed, dia, layerH);
                var shearRate = rheo.nozzleShearRate(flowRate, dia, n);
                var viscosity = rheo.powerLawViscosity(K, n, shearRate);
                var stress = viscosity * shearRate;
                var newtonianShear = rheo.nozzleShearRate(flowRate, dia, 1);

                document.getElementById('nozzleResults').innerHTML =
                    '<div class="stats-grid stats-grid-mt">' +
                    '<div class="stat-card"><div class="stat-value">' + flowRate.toFixed(4) + '</div><div class="stat-label">Flow Rate (mL/min)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + shearRate.toFixed(1) + '</div><div class="stat-label">Wall Shear Rate (1/s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + newtonianShear.toFixed(1) + '</div><div class="stat-label">Newtonian Shear Rate (1/s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + viscosity.toFixed(2) + '</div><div class="stat-label">Viscosity at Wall (Pa·s)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + stress.toFixed(1) + '</div><div class="stat-label">Wall Shear Stress (Pa)</div></div>' +
                    '<div class="stat-card"><div class="stat-value">' + ((3 * n + 1) / (4 * n)).toFixed(3) + '</div><div class="stat-label">W-R Correction Factor</div></div>' +
                    '</div>' +
                    '<p class="info-text info-text-mt">The Weissenberg-Rabinowitsch correction factor of ' +
                    ((3 * n + 1) / (4 * n)).toFixed(3) + ' adjusts the Newtonian shear rate (' + newtonianShear.toFixed(1) +
                    ' s⁻¹) for non-Newtonian flow behavior (n=' + n + ').</p>';
            } catch (e) {
                document.getElementById('nozzleResults').innerHTML = '<p class="error-msg">' + esc(e.message) + '</p>';
            }
        }

        function nozzleSweep() {
            var speed = parseFloat(document.getElementById('nzSpeed').value);
            var layerH = parseFloat(document.getElementById('nzLayerH').value);
            var n = parseFloat(document.getElementById('nzN').value);
            var K = parseFloat(document.getElementById('nzK').value);

            var diameters = [0.1, 0.15, 0.2, 0.25, 0.3, 0.41, 0.5, 0.6, 0.84, 1.0];
            var shearData = [], viscData = [];

            var html = '<table class="data-table"><thead><tr><th>Nozzle ⌀ (mm)</th><th>Flow (mL/min)</th><th>Shear Rate (1/s)</th><th>Viscosity (Pa·s)</th><th>Wall Stress (Pa)</th></tr></thead><tbody>';

            diameters.forEach(function(d) {
                try {
                    var flow = rheo.estimateFlowRate(speed, d, layerH);
                    var sr = rheo.nozzleShearRate(flow, d, n);
                    var visc = rheo.powerLawViscosity(K, n, sr);
                    shearData.push({ x: d, y: sr });
                    viscData.push({ x: d, y: visc });
                    html += '<tr><td>' + d + '</td><td>' + flow.toFixed(4) + '</td><td>' + sr.toFixed(1) + '</td><td>' + visc.toFixed(2) + '</td><td>' + (visc * sr).toFixed(1) + '</td></tr>';
                } catch (e) { /* skip */ }
            });
            html += '</tbody></table>';

            drawLogLogChart(document.getElementById('nozzleSweepChart'), [
                { data: shearData, color: COLORS[0], label: 'Shear Rate' },
                { data: viscData, color: COLORS[1], label: 'Viscosity' }
            ], { logX: false, logY: true, xLabel: 'Nozzle Diameter (mm)', yLabel: 'Value' });

            document.getElementById('nozzleSweepTable').innerHTML = html;
        }

        // ── Wire button events (no inline onclick) ──────────────
        document.getElementById('btnPlotViscosity').addEventListener('click', plotViscosityCurve);
        document.getElementById('btnAddOverlay').addEventListener('click', addOverlayCurve);
        document.getElementById('btnClearOverlays').addEventListener('click', clearOverlays);
        document.getElementById('btnFitData').addEventListener('click', fitData);
        document.getElementById('btnCompareModels').addEventListener('click', plotModelComparison);
        document.getElementById('btnPrintability').addEventListener('click', runPrintability);
        document.getElementById('btnComparePresets').addEventListener('click', compareAllPresets);
        document.getElementById('btnPlotTemp').addEventListener('click', plotTempCurve);
        document.getElementById('btnAddTempOverlay').addEventListener('click', addTempOverlay);
        document.getElementById('btnClearTempOverlays').addEventListener('click', clearTempOverlays);
        document.getElementById('btnNozzleSim').addEventListener('click', runNozzleSim);
        document.getElementById('btnNozzleSweep').addEventListener('click', nozzleSweep);

        // ── Init ────────────────────────────────────────────────
        plotViscosityCurve();

    })();