# Calculus for Computer Science — Interactive Toolkit

Live web companion to the research paper *Calculus for Computer Science: TI-84 Programming Toolkit* by Andrea Montana (IE University, 2026).

**▶ Live site:** https://andreaisabelmontana.github.io/calculus-toolkit-site/

Eleven interactive modules — one per TI-BASIC program in the paper — covering limits, continuity, derivatives (first, second, implicit), definite integrals, Maclaurin series, gradients, directional derivatives, tangent planes, and critical-point classification. Each module mirrors the calculator's numerical method, shows the underlying TI-BASIC source, and visualizes the result with 2D and 3D plots.

## Modules

| Code | Topic |
|---|---|
| LIMT | Numeric limit estimation (two-sided table + DNE check) |
| CONT | Continuity at a point (jump · removable · continuous) |
| DER1 | First derivative at a point + tangent line |
| DER2 | Second derivative & concavity |
| IMPL | Implicit differentiation `dy/dx = −Fx/Fy` |
| INT1 | Definite integral + Riemann sum overlay |
| MACL | Maclaurin polynomial via numerical derivatives |
| GRAD | Gradient vector on 3D surface and 2D contour |
| DDER | Directional derivative with auto-normalised direction |
| TANP | Tangent plane to `z = f(x,y)` |
| CRIT | Critical-point classification via `D = fxx·fyy − fxy²` |

## Stack

Pure static site — no build step. Loads three CDNs:

- [Plotly.js](https://plotly.com/javascript/) — 2D and 3D plots
- [math.js](https://mathjs.org/) — expression parser, symbolic derivative
- [MathJax 3](https://www.mathjax.org/) — LaTeX rendering

## Related

- Research paper and TI-BASIC source: https://github.com/andreaisabelmontana/Calculus-For-Computer-Science

## Local development

```bash
python -m http.server 8000
# open http://localhost:8000
```

That's it.
