/* ============================================================
   Calculus for Computer Science — interactive toolkit
   Mirrors the 11 TI-84 BASIC programs from the research paper.
   ============================================================ */

/* ---------- math.js: compile expressions into fast JS fns -- */

function compile1(expr) {
  const node = math.parse(expr);
  const c = node.compile();
  return (x) => Number(c.evaluate({ x }));
}
function compile2(expr) {
  const node = math.parse(expr);
  const c = node.compile();
  return (x, y) => Number(c.evaluate({ x, y }));
}

/* ---------- Numeric calculus helpers ----------------------- */

const H1 = 1e-5;           // first derivative
const H2 = 1e-3;           // second derivative
const HP = 1e-3;           // partials (matches TI-84 toolkit)

const d1 = (f, x, h = H1) => (f(x + h) - f(x - h)) / (2 * h);
const d2 = (f, x, h = H2) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
const partialX = (f, x, y, h = HP) => (f(x + h, y) - f(x - h, y)) / (2 * h);
const partialY = (f, x, y, h = HP) => (f(x, y + h) - f(x, y - h)) / (2 * h);
const partialXX = (f, x, y, h = HP) =>
  (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
const partialYY = (f, x, y, h = HP) =>
  (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
const partialXY = (f, x, y, h = HP) =>
  (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) /
  (4 * h * h);

const linspace = (a, b, n) => {
  const out = new Array(n);
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = a + i * step;
  return out;
};

const fmt = (v, p = 4) => {
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(p);
  return v.toFixed(p);
};

function safeNum(x) {
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (x && typeof x === 'object' && 're' in x) return x.re;
  return NaN;
}

/* ---------- Common Plotly layout -------------------------- */

const layoutBase = {
  paper_bgcolor: '#131826',
  plot_bgcolor: '#0f1424',
  font: { color: '#cfd5e3', family: 'Inter, sans-serif', size: 12 },
  margin: { l: 50, r: 20, t: 30, b: 45 },
  xaxis: { gridcolor: '#232c47', zerolinecolor: '#3a4768', linecolor: '#3a4768' },
  yaxis: { gridcolor: '#232c47', zerolinecolor: '#3a4768', linecolor: '#3a4768' },
  showlegend: true,
  legend: { bgcolor: 'rgba(15,20,36,0.6)', bordercolor: '#232c47', borderwidth: 1 },
};

function layout(extra) {
  return Object.assign(JSON.parse(JSON.stringify(layoutBase)), extra || {});
}

function layout3D(extra) {
  const base = {
    paper_bgcolor: '#131826',
    font: { color: '#cfd5e3', family: 'Inter, sans-serif', size: 11 },
    margin: { l: 0, r: 0, t: 20, b: 0 },
    showlegend: false,
    scene: {
      bgcolor: '#0f1424',
      xaxis: { gridcolor: '#232c47', zerolinecolor: '#3a4768', backgroundcolor: '#0f1424', showbackground: true },
      yaxis: { gridcolor: '#232c47', zerolinecolor: '#3a4768', backgroundcolor: '#0f1424', showbackground: true },
      zaxis: { gridcolor: '#232c47', zerolinecolor: '#3a4768', backgroundcolor: '#0f1424', showbackground: true },
      camera: { eye: { x: 1.6, y: 1.6, z: 1.0 } },
    },
  };
  if (extra) {
    if (extra.scene) Object.assign(base.scene, extra.scene);
    Object.assign(base, extra);
  }
  return base;
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };

/* ---------- Result formatting helpers --------------------- */

function row(label, value) {
  return `<span class="label">${label}</span> <span class="val">${value}</span>`;
}
function verdict(text, kind = 'info') {
  return `<div class="verdict ${kind}">${text}</div>`;
}
function err(msg) {
  return `<span class="err">⚠ ${msg}</span>`;
}

function tryRun(fn, outEl) {
  try {
    fn();
  } catch (e) {
    outEl.innerHTML = err(e.message || String(e));
    console.error(e);
  }
}

/* ============================================================
   1. LIMT — Numeric limit estimation
   ============================================================ */
function runLIMT() {
  const expr = document.getElementById('limt-f').value;
  const a = parseFloat(document.getElementById('limt-a').value);
  const out = document.getElementById('limt-out');
  tryRun(() => {
    const f = compile1(expr);
    const deltas = [0.1, 0.01, 0.001, 0.0001];
    const left = deltas.map((d) => safeNum(f(a - d)));
    const right = deltas.map((d) => safeNum(f(a + d)));
    const L = safeNum(f(a - 1e-5));
    const R = safeNum(f(a + 1e-5));

    let rows = '<table>';
    for (let i = 0; i < 4; i++) {
      rows += `<tr><td>f(${a} − ${deltas[i]})</td><td>${fmt(left[i])}</td></tr>`;
    }
    rows += '<tr><td colspan="2" style="border-top:1px solid #232c47;height:6px;"></td></tr>';
    for (let i = 3; i >= 0; i--) {
      rows += `<tr><td>f(${a} + ${deltas[i]})</td><td>${fmt(right[i])}</td></tr>`;
    }
    rows += '</table>';

    let v;
    if (!Number.isFinite(L) || !Number.isFinite(R)) {
      v = verdict('Limit diverges or undefined at a', 'bad');
    } else if (Math.abs(L - R) < 1e-4) {
      v = verdict(`Limit ≈ ${fmt((L + R) / 2, 6)}`, 'good');
    } else {
      v = verdict('Limit does not exist (one-sided values disagree)', 'bad');
    }
    out.innerHTML = rows +
      `<div style="margin-top:8px">${row('LEFT  ', fmt(L, 6))}<br>${row('RIGHT ', fmt(R, 6))}</div>` + v;

    // Plot
    const half = Math.max(0.5, Math.abs(a) * 0.6 + 1);
    const xs = linspace(a - half, a + half, 401).filter((x) => Math.abs(x - a) > 1e-6);
    const ys = xs.map(f).map(safeNum);
    const sampleX = [...deltas.map((d) => a - d), ...deltas.map((d) => a + d)];
    const sampleY = sampleX.map(f).map(safeNum);

    Plotly.newPlot('limt-plot', [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#5aa9ff', width: 2.5 }, name: 'f(x)' },
      { x: sampleX, y: sampleY, type: 'scatter', mode: 'markers',
        marker: { color: '#f7c873', size: 8, line: { color: '#0a0e1a', width: 1 } }, name: 'samples' },
      { x: [a, a], y: [Math.min(...ys.filter(Number.isFinite)), Math.max(...ys.filter(Number.isFinite))],
        type: 'scatter', mode: 'lines', line: { color: '#ff7eb3', width: 1.5, dash: 'dash' }, name: `x = ${a}` },
    ], layout({ title: '', xaxis: { ...layoutBase.xaxis, title: 'x' }, yaxis: { ...layoutBase.yaxis, title: 'f(x)' } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   2. CONT — Continuity at x = a
   ============================================================ */
function runCONT() {
  const expr = document.getElementById('cont-f').value;
  const a = parseFloat(document.getElementById('cont-a').value);
  const out = document.getElementById('cont-out');
  tryRun(() => {
    const f = compile1(expr);
    const L = safeNum(f(a - 1e-5));
    const R = safeNum(f(a + 1e-5));
    let V;
    try { V = safeNum(f(a)); } catch { V = NaN; }

    let v;
    if (!Number.isFinite(L) || !Number.isFinite(R)) {
      v = verdict('Infinite discontinuity', 'bad');
    } else if (Math.abs(L - R) >= 1e-4) {
      v = verdict('Jump discontinuity', 'bad');
    } else if (!Number.isFinite(V) || Math.abs(L - V) >= 1e-4) {
      v = verdict(`Removable — fill with ${fmt((L + R) / 2, 6)}`, 'warn');
    } else {
      v = verdict('Continuous at a', 'good');
    }
    out.innerHTML =
      row('LEFT   ', fmt(L, 6)) + '<br>' +
      row('RIGHT  ', fmt(R, 6)) + '<br>' +
      row('f(a)   ', Number.isFinite(V) ? fmt(V, 6) : 'undefined') + v;

    const half = Math.max(0.5, Math.abs(a) * 0.6 + 1);
    const xs = linspace(a - half, a + half, 401).filter((x) => Math.abs(x - a) > 1e-5);
    const ys = xs.map(f).map(safeNum);
    const traces = [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#5aa9ff', width: 2.5 }, name: 'f(x)' },
      { x: [a - 1e-5, a + 1e-5], y: [L, R], type: 'scatter', mode: 'markers',
        marker: { color: '#f7c873', size: 9 }, name: 'one-sided limits' },
      { x: [a, a], y: [Math.min(...ys.filter(Number.isFinite), L, R) - 0.5, Math.max(...ys.filter(Number.isFinite), L, R) + 0.5],
        type: 'scatter', mode: 'lines', line: { color: '#ff7eb3', dash: 'dash', width: 1.2 }, name: `x = ${a}` },
    ];
    if (Number.isFinite(V)) {
      traces.push({ x: [a], y: [V], type: 'scatter', mode: 'markers',
        marker: { color: '#6ee7b7', size: 12, symbol: 'circle-open', line: { width: 2 } }, name: 'f(a)' });
    }
    Plotly.newPlot('cont-plot', traces, layout({ xaxis: { ...layoutBase.xaxis, title: 'x' }, yaxis: { ...layoutBase.yaxis, title: 'f(x)' } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   3. DER1 — First derivative + tangent line
   ============================================================ */
function runDER1() {
  const expr = document.getElementById('der1-f').value;
  const a = parseFloat(document.getElementById('der1-a').value);
  document.getElementById('der1-aval').textContent = a.toFixed(2);
  const out = document.getElementById('der1-out');
  tryRun(() => {
    const f = compile1(expr);
    const F = safeNum(f(a));
    const D = d1(f, a);
    const B = F - D * a;
    out.innerHTML =
      row('f(a) ', fmt(F, 6)) + '<br>' +
      row("f'(a)", fmt(D, 6)) + '<br>' +
      row('tangent', `y = ${fmt(D, 4)}·x + ${fmt(B, 4)}`);

    const half = Math.max(1.5, Math.abs(a) * 0.6 + 2);
    const xs = linspace(a - half, a + half, 401);
    const ys = xs.map(f).map(safeNum);
    const tan = xs.map((x) => D * x + B);
    Plotly.newPlot('der1-plot', [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#5aa9ff', width: 2.5 }, name: 'f(x)' },
      { x: xs, y: tan, type: 'scatter', mode: 'lines', line: { color: '#f7c873', width: 2, dash: 'dot' }, name: 'tangent' },
      { x: [a], y: [F], type: 'scatter', mode: 'markers',
        marker: { color: '#ff7eb3', size: 11, line: { color: '#0a0e1a', width: 2 } }, name: '(a, f(a))' },
    ], layout({ xaxis: { ...layoutBase.xaxis, title: 'x' }, yaxis: { ...layoutBase.yaxis, title: 'y' } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   4. DER2 — Second derivative & concavity
   ============================================================ */
function runDER2() {
  const expr = document.getElementById('der2-f').value;
  const a = parseFloat(document.getElementById('der2-a').value);
  const out = document.getElementById('der2-out');
  tryRun(() => {
    const f = compile1(expr);
    const D = d2(f, a);
    let v;
    if (D > 1e-6) v = verdict('Concave up', 'good');
    else if (D < -1e-6) v = verdict('Concave down', 'good');
    else v = verdict('Possible inflection point', 'warn');
    out.innerHTML = row("f''(a)", fmt(D, 6)) + v;

    const half = Math.max(2, Math.abs(a) * 0.6 + 2);
    const xs = linspace(a - half, a + half, 301);
    const ys = xs.map(f).map(safeNum);
    const yps = xs.map((x) => d1(f, x)).map(safeNum);
    const ypps = xs.map((x) => d2(f, x)).map(safeNum);
    Plotly.newPlot('der2-plot', [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#5aa9ff', width: 2.5 }, name: 'f(x)' },
      { x: xs, y: yps, type: 'scatter', mode: 'lines', line: { color: '#f7c873', width: 2 }, name: "f'(x)" },
      { x: xs, y: ypps, type: 'scatter', mode: 'lines', line: { color: '#ff7eb3', width: 2, dash: 'dot' }, name: "f''(x)" },
      { x: [a], y: [safeNum(f(a))], type: 'scatter', mode: 'markers',
        marker: { color: '#6ee7b7', size: 10 }, name: 'a' },
    ], layout({ xaxis: { ...layoutBase.xaxis, title: 'x' }, yaxis: { ...layoutBase.yaxis, title: 'y' } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   5. IMPL — Implicit differentiation (level curve + tangent)
   ============================================================ */
function runIMPL() {
  const expr = document.getElementById('impl-f').value;
  const px = parseFloat(document.getElementById('impl-x').value);
  const py = parseFloat(document.getElementById('impl-y').value);
  const out = document.getElementById('impl-out');
  tryRun(() => {
    const F = compile2(expr);
    const Fx = partialX(F, px, py);
    const Fy = partialY(F, px, py);
    const Fval = F(px, py);
    let slope;
    let v;
    if (Math.abs(Fy) < 1e-9) {
      slope = NaN;
      v = verdict('dy/dx undefined (vertical tangent)', 'warn');
    } else {
      slope = -Fx / Fy;
      v = verdict(`dy/dx = ${fmt(slope, 5)}`, 'good');
    }
    out.innerHTML =
      row('F(x,y) ', fmt(Fval, 5)) + '<br>' +
      row('Fx     ', fmt(Fx, 5)) + '<br>' +
      row('Fy     ', fmt(Fy, 5)) + v +
      (Math.abs(Fval) > 0.05
        ? `<div class="muted" style="margin-top:8px;">Note: F(x,y) ≠ 0 at this point. Pick (x,y) on the curve for a meaningful tangent.</div>`
        : '');

    // Contour around the point
    const half = Math.max(3, Math.abs(px) + Math.abs(py) + 2);
    const N = 80;
    const xs = linspace(px - half, px + half, N);
    const ys = linspace(py - half, py + half, N);
    const Z = ys.map((y) => xs.map((x) => safeNum(F(x, y))));

    const traces = [
      { x: xs, y: ys, z: Z, type: 'contour',
        contours: { coloring: 'heatmap', start: -10, end: 10, size: 1 },
        colorscale: [[0, '#0a1638'], [0.5, '#19203a'], [1, '#5aa9ff']],
        showscale: false, opacity: 0.55, line: { color: '#3a4768', width: 1 } },
      // Zero level
      { x: xs, y: ys, z: Z, type: 'contour',
        contours: { coloring: 'none', start: 0, end: 0, size: 1, showlabels: false },
        line: { color: '#ff7eb3', width: 3 }, showscale: false, name: 'F = 0' },
      // Point
      { x: [px], y: [py], type: 'scatter', mode: 'markers',
        marker: { color: '#f7c873', size: 12, line: { color: '#0a0e1a', width: 2 } }, name: '(x,y)' },
    ];
    if (Number.isFinite(slope)) {
      const dx = half * 0.5;
      traces.push({
        x: [px - dx, px + dx], y: [py - slope * dx, py + slope * dx],
        type: 'scatter', mode: 'lines',
        line: { color: '#6ee7b7', width: 2.5, dash: 'dash' }, name: 'tangent',
      });
    }
    Plotly.newPlot('impl-plot', traces, layout({
      xaxis: { ...layoutBase.xaxis, title: 'x', range: [px - half, px + half] },
      yaxis: { ...layoutBase.yaxis, title: 'y', range: [py - half, py + half], scaleanchor: 'x' },
    }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   6. INT1 — Definite integral with Riemann sums
   ============================================================ */
function runINT1() {
  const expr = document.getElementById('int1-f').value;
  const a = parseFloat(document.getElementById('int1-a').value);
  const b = parseFloat(document.getElementById('int1-b').value);
  const n = parseInt(document.getElementById('int1-n').value, 10);
  const method = document.getElementById('int1-method').value;
  document.getElementById('int1-nval').textContent = n;
  const out = document.getElementById('int1-out');
  tryRun(() => {
    if (b <= a) throw new Error('Need b > a');
    const f = compile1(expr);

    // Exact via adaptive Simpson (high n)
    const exact = adaptiveSimpson(f, a, b, 1e-10, 20);

    // Approximations
    const dx = (b - a) / n;
    let left = 0, right = 0, mid = 0, trap = 0, simp = 0;
    for (let i = 0; i < n; i++) {
      left  += f(a + i * dx);
      right += f(a + (i + 1) * dx);
      mid   += f(a + (i + 0.5) * dx);
    }
    left *= dx; right *= dx; mid *= dx;
    trap = (dx / 2) * (f(a) + f(b) + 2 * Array.from({ length: n - 1 }, (_, i) => f(a + (i + 1) * dx)).reduce((s, v) => s + v, 0));

    if (n % 2 === 0) {
      let s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * dx);
      simp = (dx / 3) * s;
    } else simp = NaN;

    const chosen = { left, right, mid, trap, simp }[method];
    out.innerHTML =
      row('∫ exact ', fmt(exact, 8)) + '<br>' +
      row('avg val ', fmt(exact / (b - a), 6)) + '<br>' +
      `<div style="margin-top:10px;color:var(--muted);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">Riemann approximations</div>` +
      row('left   ', fmt(left, 6)) + '<br>' +
      row('right  ', fmt(right, 6)) + '<br>' +
      row('mid    ', fmt(mid, 6)) + '<br>' +
      row('trap   ', fmt(trap, 6)) + '<br>' +
      row('Simpson', Number.isFinite(simp) ? fmt(simp, 6) : 'n must be even') +
      verdict(`Selected: ${method.toUpperCase()} = ${fmt(chosen, 6)} (err ${fmt(Math.abs(chosen - exact), 3)})`, 'info');

    // Plot
    const xs = linspace(a, b, 200);
    const ys = xs.map(f).map(safeNum);
    const traces = [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#5aa9ff', width: 2.5 }, name: 'f(x)', fill: 'tozeroy', fillcolor: 'rgba(90,169,255,0.12)' },
    ];

    // Rectangles / trapezoids for the selected method
    if (method === 'left' || method === 'right' || method === 'mid') {
      const rectX = [], rectY = [];
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = x0 + dx;
        const xs2 = method === 'left' ? x0 : method === 'right' ? x1 : (x0 + x1) / 2;
        const h = f(xs2);
        rectX.push(x0, x0, x1, x1, null);
        rectY.push(0, h, h, 0, null);
      }
      traces.push({ x: rectX, y: rectY, type: 'scatter', mode: 'lines',
        line: { color: '#f7c873', width: 1 }, fill: 'toself', fillcolor: 'rgba(247,200,115,0.18)', name: `${method} rects` });
    } else if (method === 'trap') {
      const tx = [], ty = [];
      for (let i = 0; i <= n; i++) {
        const x = a + i * dx;
        tx.push(x); ty.push(f(x));
      }
      const trapX = [], trapY = [];
      for (let i = 0; i < n; i++) {
        trapX.push(tx[i], tx[i], tx[i + 1], tx[i + 1], null);
        trapY.push(0, ty[i], ty[i + 1], 0, null);
      }
      traces.push({ x: trapX, y: trapY, type: 'scatter', mode: 'lines',
        line: { color: '#f7c873', width: 1 }, fill: 'toself', fillcolor: 'rgba(247,200,115,0.18)', name: 'trapezoids' });
    }

    Plotly.newPlot('int1-plot', traces, layout({
      xaxis: { ...layoutBase.xaxis, title: 'x', range: [a - (b - a) * 0.05, b + (b - a) * 0.05] },
      yaxis: { ...layoutBase.yaxis, title: 'f(x)' },
    }), PLOTLY_CONFIG);
  }, out);
}

function adaptiveSimpson(f, a, b, eps, maxDepth) {
  function simpson(a, b) {
    const c = (a + b) / 2;
    return ((b - a) / 6) * (f(a) + 4 * f(c) + f(b));
  }
  function helper(a, b, eps, S, depth) {
    const c = (a + b) / 2;
    const Sl = simpson(a, c), Sr = simpson(c, b);
    if (depth <= 0 || Math.abs(Sl + Sr - S) <= 15 * eps) return Sl + Sr + (Sl + Sr - S) / 15;
    return helper(a, c, eps / 2, Sl, depth - 1) + helper(c, b, eps / 2, Sr, depth - 1);
  }
  return helper(a, b, eps, simpson(a, b), maxDepth);
}

/* ============================================================
   7. MACL — Maclaurin polynomial via numerical derivatives
   ============================================================ */
function runMACL() {
  const expr = document.getElementById('macl-f').value;
  const n = parseInt(document.getElementById('macl-n').value, 10);
  const R = Math.abs(parseFloat(document.getElementById('macl-r').value)) || 3;
  document.getElementById('macl-nval').textContent = n;
  const out = document.getElementById('macl-out');
  tryRun(() => {
    const f = compile1(expr);

    // Numerical derivatives at 0 — match the TI-84 stencils up to 4th order;
    // use math.js symbolic derivative for higher orders as a robust fallback.
    const coeffs = [];
    coeffs[0] = safeNum(f(0));
    coeffs[1] = d1(f, 0);
    coeffs[2] = d2(f, 0);
    // 3rd and 4th derivatives via central stencils (h=0.05 for stability)
    const h = 0.05;
    const f3 = (f(2 * h) - 2 * f(h) + 2 * f(-h) - f(-2 * h)) / (2 * h * h * h);
    const f4 = (f(2 * h) - 4 * f(h) + 6 * f(0) - 4 * f(-h) + f(-2 * h)) / (h * h * h * h);
    coeffs[3] = f3;
    coeffs[4] = f4;
    // Higher orders via repeated symbolic differentiation
    if (n >= 5) {
      let node = math.parse(expr);
      for (let k = 1; k <= n; k++) {
        node = math.derivative(node, 'x');
        if (k >= 5) {
          try { coeffs[k] = Number(node.evaluate({ x: 0 })); }
          catch { coeffs[k] = NaN; }
        }
      }
    }

    // P_k(x) coefficient of x^k = f^(k)(0)/k!
    const factorial = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
    const polyCoef = coeffs.map((c, k) => c / factorial(k));

    let rows = '<table>';
    for (let k = 0; k <= n; k++) {
      rows += `<tr><td>c<sub>${k}</sub> = f<sup>(${k})</sup>(0)/${k}!</td><td>${fmt(polyCoef[k], 6)}</td></tr>`;
    }
    rows += '</table>';
    out.innerHTML = rows + verdict(`P${n}(x) built from ${n + 1} coefficients`, 'good');

    const xs = linspace(-R, R, 401);
    const ys = xs.map(f).map(safeNum);
    const palette = ['#f7c873', '#ff7eb3', '#6ee7b7', '#a78bfa', '#fb923c', '#22d3ee'];
    const traces = [{ x: xs, y: ys, type: 'scatter', mode: 'lines',
      line: { color: '#5aa9ff', width: 3 }, name: 'f(x)' }];
    for (let deg = 1; deg <= n; deg++) {
      const p = xs.map((x) => {
        let s = 0, xp = 1;
        for (let k = 0; k <= deg; k++) { s += polyCoef[k] * xp; xp *= x; }
        return s;
      });
      traces.push({ x: xs, y: p, type: 'scatter', mode: 'lines',
        line: { color: palette[(deg - 1) % palette.length], width: 1.8, dash: deg === n ? 'solid' : 'dot' }, name: `P${deg}(x)` });
    }
    Plotly.newPlot('macl-plot', traces, layout({
      xaxis: { ...layoutBase.xaxis, title: 'x' },
      yaxis: { ...layoutBase.yaxis, title: 'y', range: [Math.min(...ys.filter(Number.isFinite)) - 1, Math.max(...ys.filter(Number.isFinite)) + 1] },
    }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   8. GRAD — Gradient (3D surface + 2D contour with arrow)
   ============================================================ */
function runGRAD() {
  const expr = document.getElementById('grad-f').value;
  const px = parseFloat(document.getElementById('grad-x').value);
  const py = parseFloat(document.getElementById('grad-y').value);
  const out = document.getElementById('grad-out');
  tryRun(() => {
    const f = compile2(expr);
    const Fx = partialX(f, px, py);
    const Fy = partialY(f, px, py);
    const Fval = f(px, py);
    const mag = Math.sqrt(Fx * Fx + Fy * Fy);

    out.innerHTML =
      row('f(p,q) ', fmt(Fval, 5)) + '<br>' +
      row('fx     ', fmt(Fx, 5)) + '<br>' +
      row('fy     ', fmt(Fy, 5)) + '<br>' +
      row('‖∇f‖   ', fmt(mag, 5)) +
      verdict(`∇f = ⟨${fmt(Fx, 4)}, ${fmt(Fy, 4)}⟩`, 'good');

    // Build surface around point
    const half = Math.max(2, Math.abs(px) + Math.abs(py) + 1);
    const N = 40;
    const xs = linspace(px - half, px + half, N);
    const ys = linspace(py - half, py + half, N);
    const Z = ys.map((y) => xs.map((x) => safeNum(f(x, y))));

    Plotly.newPlot('grad-plot3d', [
      { x: xs, y: ys, z: Z, type: 'surface',
        colorscale: [[0, '#0a1638'], [0.5, '#2a5599'], [1, '#a3d1ff']],
        showscale: false, opacity: 0.95, contours: { z: { show: true, color: '#3a4768', width: 1 } } },
      { x: [px], y: [py], z: [Fval], type: 'scatter3d', mode: 'markers',
        marker: { color: '#ff7eb3', size: 6 }, name: 'point' },
      // Gradient arrow at base — drawn as a 3D line at z = Fval
      { x: [px, px + Fx / mag], y: [py, py + Fy / mag], z: [Fval, Fval],
        type: 'scatter3d', mode: 'lines',
        line: { color: '#f7c873', width: 8 }, name: '∇f' },
    ], layout3D({ scene: { xaxis: { title: 'x' }, yaxis: { title: 'y' }, zaxis: { title: 'f' } } }), PLOTLY_CONFIG);

    // 2D contour with gradient
    Plotly.newPlot('grad-plot2d', [
      { x: xs, y: ys, z: Z, type: 'contour',
        colorscale: [[0, '#0a1638'], [0.5, '#19203a'], [1, '#5aa9ff']],
        showscale: false, opacity: 0.8, contours: { coloring: 'heatmap', showlabels: false },
        line: { color: '#3a4768', width: 1 } },
      { x: [px], y: [py], type: 'scatter', mode: 'markers',
        marker: { color: '#ff7eb3', size: 12, line: { color: '#0a0e1a', width: 2 } }, name: '(p,q)' },
      { x: [px, px + Fx * 0.3], y: [py, py + Fy * 0.3], type: 'scatter', mode: 'lines+markers',
        line: { color: '#f7c873', width: 4 },
        marker: { color: '#f7c873', size: [0, 12], symbol: ['circle', 'triangle-right'] }, name: '∇f' },
    ], layout({
      xaxis: { ...layoutBase.xaxis, title: 'x', range: [px - half, px + half] },
      yaxis: { ...layoutBase.yaxis, title: 'y', range: [py - half, py + half], scaleanchor: 'x' },
    }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   9. DDER — Directional derivative
   ============================================================ */
function runDDER() {
  const expr = document.getElementById('dder-f').value;
  const px = parseFloat(document.getElementById('dder-x').value);
  const py = parseFloat(document.getElementById('dder-y').value);
  const u1 = parseFloat(document.getElementById('dder-u1').value);
  const u2 = parseFloat(document.getElementById('dder-u2').value);
  const out = document.getElementById('dder-out');
  tryRun(() => {
    const norm = Math.sqrt(u1 * u1 + u2 * u2);
    if (norm === 0) { out.innerHTML = err('Zero direction vector'); return; }
    const f = compile2(expr);
    const Fx = partialX(f, px, py);
    const Fy = partialY(f, px, py);
    const uh1 = u1 / norm, uh2 = u2 / norm;
    const Du = Fx * uh1 + Fy * uh2;
    const Fval = f(px, py);

    out.innerHTML =
      row('unit u ', `⟨${fmt(uh1, 4)}, ${fmt(uh2, 4)}⟩`) + '<br>' +
      row('fx     ', fmt(Fx, 5)) + '<br>' +
      row('fy     ', fmt(Fy, 5)) +
      verdict(`Dᵤf = ${fmt(Du, 5)}`, 'good');

    const half = Math.max(2, Math.abs(px) + Math.abs(py) + 1);
    const N = 40;
    const xs = linspace(px - half, px + half, N);
    const ys = linspace(py - half, py + half, N);
    const Z = ys.map((y) => xs.map((x) => safeNum(f(x, y))));

    // Slice along direction u
    const tT = linspace(-half * 0.9, half * 0.9, 60);
    const sliceX = tT.map((t) => px + uh1 * t);
    const sliceY = tT.map((t) => py + uh2 * t);
    const sliceZ = tT.map((t, i) => safeNum(f(sliceX[i], sliceY[i])));

    Plotly.newPlot('dder-plot', [
      { x: xs, y: ys, z: Z, type: 'surface',
        colorscale: [[0, '#0a1638'], [0.5, '#2a5599'], [1, '#a3d1ff']],
        showscale: false, opacity: 0.85 },
      { x: sliceX, y: sliceY, z: sliceZ, type: 'scatter3d', mode: 'lines',
        line: { color: '#ff7eb3', width: 6 }, name: 'slice along u' },
      { x: [px], y: [py], z: [Fval], type: 'scatter3d', mode: 'markers',
        marker: { color: '#f7c873', size: 6 }, name: 'point' },
    ], layout3D({ scene: { xaxis: { title: 'x' }, yaxis: { title: 'y' }, zaxis: { title: 'f' } } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   10. TANP — Tangent plane to z = f(x,y)
   ============================================================ */
function runTANP() {
  const expr = document.getElementById('tanp-f').value;
  const px = parseFloat(document.getElementById('tanp-x').value);
  const py = parseFloat(document.getElementById('tanp-y').value);
  const out = document.getElementById('tanp-out');
  tryRun(() => {
    const f = compile2(expr);
    const Fx = partialX(f, px, py);
    const Fy = partialY(f, px, py);
    const Z0 = f(px, py);

    out.innerHTML =
      row('z₀ = f(p,q)', fmt(Z0, 5)) + '<br>' +
      row('fx        ', fmt(Fx, 5)) + '<br>' +
      row('fy        ', fmt(Fy, 5)) +
      verdict(`z = ${fmt(Z0, 4)} + ${fmt(Fx, 4)}·(x − ${fmt(px, 3)}) + ${fmt(Fy, 4)}·(y − ${fmt(py, 3)})`, 'good');

    const half = Math.max(2, Math.abs(px) + Math.abs(py) + 1);
    const N = 35;
    const xs = linspace(px - half, px + half, N);
    const ys = linspace(py - half, py + half, N);
    const Z = ys.map((y) => xs.map((x) => safeNum(f(x, y))));
    const P = ys.map((y) => xs.map((x) => Z0 + Fx * (x - px) + Fy * (y - py)));

    Plotly.newPlot('tanp-plot', [
      { x: xs, y: ys, z: Z, type: 'surface',
        colorscale: [[0, '#0a1638'], [0.5, '#2a5599'], [1, '#a3d1ff']],
        showscale: false, opacity: 0.85, name: 'f(x,y)' },
      { x: xs, y: ys, z: P, type: 'surface',
        colorscale: [[0, '#3d2840'], [0.5, '#7a3d80'], [1, '#ff7eb3']],
        showscale: false, opacity: 0.55, name: 'tangent plane' },
      { x: [px], y: [py], z: [Z0], type: 'scatter3d', mode: 'markers',
        marker: { color: '#f7c873', size: 8 }, name: 'point' },
    ], layout3D({ scene: { xaxis: { title: 'x' }, yaxis: { title: 'y' }, zaxis: { title: 'z' } } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   11. CRIT — Critical point classification
   ============================================================ */
function runCRIT() {
  const expr = document.getElementById('crit-f').value;
  const px = parseFloat(document.getElementById('crit-x').value);
  const py = parseFloat(document.getElementById('crit-y').value);
  const out = document.getElementById('crit-out');
  tryRun(() => {
    const f = compile2(expr);
    const Fxx = partialXX(f, px, py);
    const Fyy = partialYY(f, px, py);
    const Fxy = partialXY(f, px, py);
    const Fx = partialX(f, px, py);
    const Fy = partialY(f, px, py);
    const D = Fxx * Fyy - Fxy * Fxy;
    const Fval = f(px, py);

    const isCrit = Math.abs(Fx) < 1e-3 && Math.abs(Fy) < 1e-3;
    let v;
    if (Math.abs(D) < 1e-9) v = verdict('Test fails (D ≈ 0)', 'warn');
    else if (D > 0 && Fxx > 0) v = verdict('Local minimum', 'good');
    else if (D > 0 && Fxx < 0) v = verdict('Local maximum', 'good');
    else if (D < 0) v = verdict('Saddle point', 'bad');
    else v = verdict('Inconclusive', 'warn');

    out.innerHTML =
      row('f(p,q)', fmt(Fval, 5)) + '<br>' +
      row('fx    ', fmt(Fx, 5)) + '<br>' +
      row('fy    ', fmt(Fy, 5)) + '<br>' +
      row('fxx   ', fmt(Fxx, 5)) + '<br>' +
      row('fyy   ', fmt(Fyy, 5)) + '<br>' +
      row('fxy   ', fmt(Fxy, 5)) + '<br>' +
      row('D     ', fmt(D, 5)) +
      (isCrit ? '' : `<div class="muted" style="margin-top:8px;">∇f ≠ 0 here — this point isn't actually critical. Slide x,y until fx ≈ fy ≈ 0.</div>`) + v;

    const half = Math.max(2, Math.abs(px) + Math.abs(py) + 1.5);
    const N = 40;
    const xs = linspace(px - half, px + half, N);
    const ys = linspace(py - half, py + half, N);
    const Z = ys.map((y) => xs.map((x) => safeNum(f(x, y))));

    Plotly.newPlot('crit-plot', [
      { x: xs, y: ys, z: Z, type: 'surface',
        colorscale: [[0, '#0a1638'], [0.5, '#2a5599'], [1, '#a3d1ff']],
        showscale: false, opacity: 0.95,
        contours: { z: { show: true, color: '#3a4768', width: 1 } } },
      { x: [px], y: [py], z: [Fval], type: 'scatter3d', mode: 'markers',
        marker: { color: '#ff7eb3', size: 8, symbol: 'diamond' }, name: '(p,q)' },
    ], layout3D({ scene: { xaxis: { title: 'x' }, yaxis: { title: 'y' }, zaxis: { title: 'f' } } }), PLOTLY_CONFIG);
  }, out);
}

/* ============================================================
   TI-BASIC source snippets — inlined so the page is offline-safe
   ============================================================ */
const TI_SOURCES = {
  limt: `PROGRAM:LIMT
:ClrHome
:Disp "NUMERIC LIMIT EST"
:Disp "ENTER F(X) IN Y1"
:Disp "THEN PRESS ENTER"
:Pause
:Prompt A
:ClrHome
:Disp "X -> A FROM LEFT:"
:Disp Y1(A-.1)
:Disp Y1(A-.01)
:Disp Y1(A-.001)
:Disp Y1(A-.0001)
:Pause
:ClrHome
:Disp "X -> A FROM RIGHT:"
:Disp Y1(A+.0001)
:Disp Y1(A+.001)
:Disp Y1(A+.01)
:Disp Y1(A+.1)
:Pause
:ClrHome
:Y1(A-1E-5)->L
:Y1(A+1E-5)->R
:Disp "LEFT  =",L
:Disp "RIGHT =",R
:If abs(L-R)<1E-4
:Then
:Disp "LIMIT EXISTS:"
:Disp (L+R)/2
:Else
:Disp "LIMIT DNE"
:End`,
  cont: `PROGRAM:CONT
:ClrHome
:Disp "CONTINUITY CHECK"
:Disp "AT X = A"
:Disp "F(X) IN Y1"
:Prompt A
:Y1(A-1E-5)->L
:Y1(A+1E-5)->R
:Y1(A)->V
:ClrHome
:Disp "LEFT   =",L
:Disp "RIGHT  =",R
:Disp "F(A)   =",V
:If abs(L-R)>=1E-4
:Then:Disp "JUMP DISCONT.":Goto Z:End
:If abs(L-V)>=1E-4
:Then:Disp "REMOVABLE DISC."
:Disp "FILLED VALUE:"
:Disp (L+R)/2:Goto Z:End
:Disp "CONTINUOUS AT A"
:Lbl Z`,
  der1: `PROGRAM:DER1
:ClrHome
:Disp "DERIVATIVE AT PT"
:Disp "F(X) IN Y1"
:Prompt A
:nDeriv(Y1,X,A)->D
:Y1(A)->F
:F-D*A->B
:ClrHome
:Disp "F(A)  =",F
:Disp "F'(A) =",D
:Disp "TANGENT LINE:"
:Disp "Y = MX + B"
:Disp "M =",D
:Disp "B =",B`,
  der2: `PROGRAM:DER2
:ClrHome
:Disp "2ND DERIV / CONC"
:Disp "F(X) IN Y1"
:Prompt A
:.001->H
:(Y1(A+H)-2Y1(A)+Y1(A-H))/H^2->D
:ClrHome
:Disp "F''(A) =",D
:If D>1E-6:Then:Disp "CONCAVE UP":End
:If D<-1E-6:Then:Disp "CONCAVE DOWN":End
:If abs(D)<=1E-6:Then:Disp "POSSIBLE":Disp "INFLECTION PT":End`,
  impl: `PROGRAM:IMPL
:ClrHome
:Disp "IMPLICIT DIFF"
:Disp "F(X,Y)=0 FORM"
:Input "F(X,Y)=",Str1
:Prompt X,Y
:X->P:Y->Q
:.001->H
:P+H->X:Q->Y:expr(Str1)->A
:P-H->X:expr(Str1)->B
:(A-B)/(2H)->U
:P->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:(A-B)/(2H)->V
:ClrHome
:Disp "Fx =",U
:Disp "Fy =",V
:If abs(V)<1E-9
:Then:Disp "dy/dx UNDEFINED"
:Else:Disp "dy/dx =",-U/V:End`,
  int1: `PROGRAM:INT1
:ClrHome
:Disp "DEFINITE INTEGRAL"
:Disp "F(X) IN Y1"
:Input "LOWER A=",A
:Input "UPPER B=",B
:fnInt(Y1,X,A,B)->I
:ClrHome
:Disp "INTEGRAL FROM"
:Disp A,"TO",B
:Disp "EQUALS:"
:Disp I
:Disp "AVG VALUE:"
:Disp I/(B-A)`,
  macl: `PROGRAM:MACL
:ClrHome
:Disp "MACLAURIN POLY"
:Disp "DEGREE 4"
:Disp "F(X) IN Y1"
:Pause
:.01->H
:Y1(0)->A
:(Y1(H)-Y1(-H))/(2H)->B
:(Y1(H)-2Y1(0)+Y1(-H))/H^2->C
:(Y1(2H)-2Y1(H)+2Y1(-H)-Y1(-2H))/(2H^3)->D
:(Y1(2H)-4Y1(H)+6Y1(0)-4Y1(-H)+Y1(-2H))/H^4->E
:ClrHome
:Disp "P4(X) COEFFS:"
:Disp "c0 =",A
:Disp "c1 =",B
:Disp "c2 =",C/2
:Disp "c3 =",D/6
:Disp "c4 =",E/24
:{A,B,C/2,D/6,E/24}->L1`,
  grad: `PROGRAM:GRAD
:ClrHome
:Disp "GRADIENT OF F"
:Disp "USE X AND Y"
:Input "F(X,Y)=",Str1
:Prompt X,Y
:X->P:Y->Q
:.001->H
:P+H->X:Q->Y:expr(Str1)->A
:P-H->X:expr(Str1)->B
:(A-B)/(2H)->U
:P->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:(A-B)/(2H)->V
:P->X:Q->Y:expr(Str1)->F
:{U,V}->L2
:ClrHome
:Disp "F(P,Q) =",F
:Disp "Fx =",U
:Disp "Fy =",V
:Disp "|GRAD F| =",sqrt(U^2+V^2)`,
  dder: `PROGRAM:DDER
:ClrHome
:Disp "DIR DERIVATIVE"
:Input "F(X,Y)=",Str1
:Prompt X,Y
:Input "U1=",U
:Input "U2=",V
:sqrt(U^2+V^2)->N
:If N=0:Then:Disp "ZERO VECTOR":Stop:End
:U/N->U:V/N->V
:X->P:Y->Q
:.001->H
:P+H->X:Q->Y:expr(Str1)->A
:P-H->X:expr(Str1)->B
:(A-B)/(2H)->FX
:P->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:(A-B)/(2H)->FY
:FX*U+FY*V->D
:ClrHome
:Disp "Fx =",FX
:Disp "Fy =",FY
:Disp "D_u F =",D`,
  tanp: `PROGRAM:TANP
:ClrHome
:Disp "TANGENT PLANE TO"
:Disp "Z = F(X,Y)"
:Input "F(X,Y)=",Str1
:Prompt X,Y
:X->P:Y->Q
:expr(Str1)->Z
:.001->H
:P+H->X:Q->Y:expr(Str1)->A
:P-H->X:expr(Str1)->B
:(A-B)/(2H)->U
:P->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:(A-B)/(2H)->V
:ClrHome
:Disp "PLANE EQUATION:"
:Disp "Z =",Z
:Disp "+ (Fx)(X-P)"
:Disp "+ (Fy)(Y-Q)"`,
  crit: `PROGRAM:CRIT
:ClrHome
:Disp "2-VAR CRIT POINT"
:Input "F(X,Y)=",Str1
:Prompt X,Y
:X->P:Y->Q
:.001->H
:H^2->K
:P+H->X:Q->Y:expr(Str1)->A
:P-H->X:expr(Str1)->B
:P->X:expr(Str1)->C
:(A-2C+B)/K->FXX
:P->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:Q->Y:expr(Str1)->C
:(A-2C+B)/K->FYY
:P+H->X:Q+H->Y:expr(Str1)->A
:Q-H->Y:expr(Str1)->B
:P-H->X:Q+H->Y:expr(Str1)->C
:Q-H->Y:expr(Str1)->E
:(A-B-C+E)/(4K)->FXY
:FXX*FYY-FXY^2->D
:Disp "Fxx=",FXX
:Disp "Fyy=",FYY
:Disp "Fxy=",FXY
:Disp "D  =",D
:If D>0 and FXX>0:Then:Disp "LOCAL MIN":End
:If D>0 and FXX<0:Then:Disp "LOCAL MAX":End
:If D<0:Then:Disp "SADDLE PT":End`,
};

/* ============================================================
   Dispatcher + navigation
   ============================================================ */
const RUNNERS = {
  limt: runLIMT, cont: runCONT, der1: runDER1, der2: runDER2,
  impl: runIMPL, int1: runINT1, macl: runMACL,
  grad: runGRAD, dder: runDDER, tanp: runTANP, crit: runCRIT,
};

function showSection(id) {
  document.querySelectorAll('.module').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(id) || document.getElementById('home');
  target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.section === id);
  });
  if (RUNNERS[id]) RUNNERS[id]();
  document.querySelector('.sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function init() {
  // Inject TI-BASIC source into <pre> tags
  for (const [k, v] of Object.entries(TI_SOURCES)) {
    const el = document.getElementById('src-' + k);
    if (el) el.textContent = v;
  }

  // Nav clicks
  document.querySelectorAll('[data-section]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.dataset.section;
      history.replaceState(null, '', '#' + id);
      showSection(id);
    });
  });

  // Run buttons
  document.querySelectorAll('[data-run]').forEach((btn) => {
    btn.addEventListener('click', () => RUNNERS[btn.dataset.run]?.());
  });

  // Enter to compute inside any panel
  document.querySelectorAll('.panel input, .panel select').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const section = el.closest('.module');
        const id = section?.id;
        if (id && RUNNERS[id]) RUNNERS[id]();
      }
    });
    // Live update for sliders / selects
    if (el.type === 'range' || el.tagName === 'SELECT') {
      el.addEventListener('input', () => {
        const id = el.closest('.module')?.id;
        if (id && RUNNERS[id]) RUNNERS[id]();
      });
    }
  });

  // Mobile menu
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Hash routing
  const initial = window.location.hash.slice(1) || 'home';
  showSection(initial);
  window.addEventListener('hashchange', () => {
    showSection(window.location.hash.slice(1) || 'home');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
