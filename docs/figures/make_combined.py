# Report figure: build + test in one. Reuses the sketches of make_fig.py and make_val.py.
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
def load(path):
    ns = {'__name__': 'module'}; argv = sys.argv; sys.argv = ['x', os.devnull]
    exec(open(path).read(), ns); sys.argv = argv; return ns
F = load('make_fig.py'); V = load('make_val.py')
INK, MUT, BLUE, TINT, ORG, PANEL, LINE = F['INK'], F['MUT'], F['BLUE'], F['TINT'], F['ORG'], F['PANEL'], F['LINE']
FONT = F['FONT']
out = []
def el(s): out.append(s)
def t(x, y, s, size=13, fill=INK, w=400, anchor='start'):
    el(f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}">{s}</text>')
def rect(x, y, w, h, fill, stroke=None, rx=8, sw=1, dash=None):
    el(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '') + (f' stroke-dasharray="{dash}"' if dash else '') + '/>')
def arrow(pts, col=INK, w=2):
    d = 'M' + ' L'.join('%.1f,%.1f' % p for p in pts)
    el(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linejoin="round"/>')
    (x1, y1), (x2, y2) = pts[-2], pts[-1]; a = math.atan2(y2 - y1, x2 - x1)
    p = lambda r, da: (x2 - r * math.cos(a + da), y2 - r * math.sin(a + da))
    el('<polygon points="%.1f,%.1f %.1f,%.1f %.1f,%.1f" fill="%s"/>' % (x2, y2, *p(11, .45), *p(11, -.45), col))
def fig_sketch(i, x, y, size):
    F['out'] = []; F['FIG_S'] = size; F['sketch'](i, x, y); out.extend(F['out'])
def val_sketch(i, x, y, w, h):
    V['out'] = []; V['sketch'](i, x, y, w, h); out.extend(V['out'])

GUT, X0 = 46, 12
CW, CG = 232, 34           # column width / gap
DW = 290                   # decision column width
TOP, RH, RG = 16, 380, 70  # row top, row height, gap between rows
SK = 190                   # sketch box
W = X0 + GUT + 6 * CW + 6 * CG + DW + 12
H = TOP + 2 * RH + RG + 16
colx = lambda c: X0 + GUT + c * (CW + CG)
rowy = lambda r: TOP + r * (RH + RG)

def panel(c, r, n, title, lines, hl=None, w=CW, h=RH):
    x, y = colx(c), rowy(r)
    rect(x, y, w, h, PANEL, hl or LINE, 10, 2 if hl else 1)
    el(f'<circle cx="{x+24:.1f}" cy="{y+30}" r="13" fill="{INK}"/>'); t(x + 24, y + 35, n, 13, '#FFFFFF', 700, 'middle')
    t(x + 44, y + 35.5, title, 15.5 if len(title) < 21 else 14, INK, 700)
    rect(x + 12, y + 54, w - 24, SK + 26, '#FFFFFF', None, 6)
    for k, ln in enumerate(lines): t(x + 16, y + 54 + SK + 54 + k * 20, ln, 13.5, MUT)
    return x, y

for r, lab, col in ((0, 'BUILD', INK), (1, 'TEST', ORG)):
    y = rowy(r) + RH / 2
    el(f'<text transform="translate({X0+18},{y:.1f}) rotate(-90)" font-family="{FONT}" font-size="15" font-weight="700" letter-spacing="3" fill="{col}" text-anchor="middle">{lab}</text>')

build = [('Multiple variables', ['20 inputs that move the', 'heating or cooling peak']),
         ('Design space', ['Each input is one axis: a', '20-dimensional space']),
         ('Latin hypercube sampling', ['1,000–5,500 training', 'designs per model']),
         ('EnergyPlus', ['ASHRAE design days; peak =', 'highest one-hour average']),
         ('Fitting', ['26 physics features; quadratic', 'or neural-network model']),
         ('Surrogate model', ['Instant heating and', 'cooling peaks'])]
for c, (title, lines) in enumerate(build):
    x, y = panel(c, 0, str(c + 1), title, lines, BLUE if c == 5 else None)
    fig_sketch(c, x + (CW - SK) / 2, y + 62, SK)
    if c < 5:
        ay = y + 54 + (SK + 26) / 2
        arrow([(x + CW + 4, ay), (x + CW + CG - 4, ay)])

x, y = colx(0), rowy(1)
rect(x, y, CW, RH, '#FFFFFF', ORG, 10, 1.5, '5 4')
t(x + 16, y + 34, 'Every model is tested', 15.5, ORG, 700)
for k, ln in enumerate(['on new EnergyPlus runs it', 'never saw: 101 designs from', 'a separate sample (51 with', 'ordinary inputs, 50 with', 'extended inputs).', '', 'Repeated for all 243 models', '(9 building types × 27 cities)', 'after every refit.']):
    t(x + 16, y + 64 + k * 21, ln, 14, INK if k < 5 else MUT)

test = [(2, 'T1', 'Independent test sample', ['Same design space, new', 'sample, never used to fit']),
        (3, 'T2', 'EnergyPlus reference', ['Each test design simulated', 'on every design day']),
        (4, 'T3', 'Compare with surrogate', ['Example: office, Chicago;', 'band is ±5%']),
        (5, 'T4', 'Score', ['95th-percentile error on the', 'worst design day'])]
for c, n, title, lines in test:
    x, y = panel(c, 1, n, title, lines)
    bx, by, bw, bh = x + 14, y + 60, CW - 28, SK + 14
    if c == 2: val_sketch(0, bx - 8, by + 4, bw + 16, bh)
    elif c == 3: fig_sketch(3, x + (CW - SK) / 2, y + 62, SK)
    elif c == 4: val_sketch(2, bx, by + 4, bw, bh - 4)
    elif c == 5: val_sketch(3, bx, by + 6, bw, bh - 8)
    if c < 5:
        ay = y + 54 + (SK + 26) / 2
        arrow([(x + CW + 4, ay), (x + CW + CG - 4, ay)], ORG)

x2 = colx(1) + CW / 2; yb = rowy(0) + RH; ty = rowy(1) + 54 + (SK + 26) / 2
arrow([(x2, yb + 4), (x2, ty), (colx(2) - 4, ty)], ORG)
t(x2 + 8, yb + 30, 'new sample', 12.5, ORG, 600)
sx = colx(5) + CW / 2; cx = colx(4) + CW / 2; my = yb + RG / 2
arrow([(sx - 30, yb + 4), (sx - 30, my), (cx, my), (cx, rowy(1) - 4)], BLUE)
t(cx + 8, my - 7, 'predictions', 12.5, BLUE, 600)

dx, dy, dh = colx(6), rowy(0), 2 * RH + RG
rect(dx, dy, DW, dh, PANEL, LINE, 10)
el(f'<circle cx="{dx+24:.1f}" cy="{dy+30}" r="13" fill="{INK}"/>'); t(dx + 24, dy + 35, '7', 13, '#FFFFFF', 700, 'middle')
t(dx + 44, dy + 35.5, 'What the tool shows', 15.5, INK, 700)
sy = dy + (dh - 236) / 2 + 10; dcx = dx + 12 + (DW - 24) / 2; dmy = sy + 40
rect(dx + 12, sy - 14, DW - 24, 250, '#FFFFFF', None, 6)
val_sketch(4, dx + 12, sy, DW - 24, 236)
for k, ln in enumerate(['Each model’s score decides', 'how its results are labelled', 'on the page.']):
    t(dx + 16, dy + 74 + k * 20, ln, 13.5, MUT)
for k, ln in enumerate(['Checked separately for ordinary', 'and extended inputs. Any result', 'can be confirmed with a full', 'EnergyPlus run in the browser.']):
    t(dx + 16, sy + 262 + k * 20, ln, 13.5, MUT)
ay0 = rowy(0) + 54 + (SK + 26) / 2; ay1 = rowy(1) + 54 + (SK + 26) / 2; jx = dx - CG / 2
arrow([(colx(5) + CW + 4, ay0), (dcx, ay0), (dcx, sy + 4)], BLUE)
arrow([(colx(5) + CW + 4, ay1), (jx, ay1), (jx, dmy), (dcx - 80, dmy)], ORG)
t(colx(5) + CW + 6, ay0 - 8, 'result', 12, BLUE, 600)
el(f'<text transform="translate({jx-6:.1f},{(ay1+dmy)/2:.1f}) rotate(-90)" font-family="{FONT}" font-size="12" font-weight="600" fill="{ORG}" text-anchor="middle">score</text>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}"><rect width="{W:.0f}" height="{H:.0f}" fill="#FFFFFF"/>' + ''.join(out) + '</svg>'
open(sys.argv[1], 'w').write(svg); print(W, H)
