# Report figure: how each surrogate is tested. Real data from valdata.json. Writes the SVG named on the command line.
import json, math, sys, os
INK='#15202B'; MUT='#5A6875'; BLUE='#1D5FB4'; TINT='#E8F0FB'; ORG='#B4500F'; PANEL='#F4F6F8'; LINE='#C9D2DB'; GRID='#DDE4EA'
GOOD='#1F7A4D'; GOODT='#E3F2EA'; WARN='#8A6400'; WARNT='#FBF1D6'; RED='#B42318'
FONT="Helvetica, Arial, sans-serif"
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])) if sys.argv[0] not in ('x', '') else '.', 'valdata.json')))
OC, SF = D['office|chicago'], D['sports|sanfrancisco']
def pct(v, q):
    s = sorted(v); k = (len(s) - 1) * q / 100.0; lo, hi = int(math.floor(k)), int(math.ceil(k)); return s[lo] + (s[hi] - s[lo]) * (k - lo)
W, H = 1648, 506
PW, GAP, X0, Y0, PH = 296, 36, 12, 16, 410
FIG_Y, FIG_H = Y0 + 64, 236
out = []
def el(s): out.append(s)
def t(x, y, s, size=13, fill=INK, w=400, anchor='start'):
    el(f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}">{s}</text>')
def line(x1, y1, x2, y2, col=MUT, w=1.2, dash=None):
    el(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{w}"' + (f' stroke-dasharray="{dash}"' if dash else '') + '/>')
def rect(x, y, w, h, fill, stroke=None, rx=6, sw=1):
    el(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}"' + (f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '') + '/>')

oc_clg_p95 = pct([r['clg'][2] for r in OC['rows']], 95)
panels = [
 ('Independent test sample', ['101 new designs per model from a', 'separate sample (51 ordinary,', '50 extended inputs), never fitted']),
 ('Simulate and predict', ['Each test design is run in', 'EnergyPlus (the reference) and', 'predicted by the surrogate']),
 ('Compare peaks', ['Example: office, Chicago.', 'Points on the line agree;', 'the band is ±5%']),
 ('Score: 95th-percentile error', ['Error of each peak vs EnergyPlus.', '95% of designs must be within 5%,', 'on every design day']),
 ('Decision', ['Scored separately for ordinary', 'and extended inputs; both', 'must pass']),
]

def sketch(i, x, y, w, h):
    if i == 0:   # training dots + test rings in a sampled square
        n = 10; a = x + 34; b = y + 14; s = min(w - 68, h - 60); st = s / n
        for k in range(n + 1):
            line(a + k * st, b, a + k * st, b + s, GRID, 1); line(a, b + k * st, a + s, b + k * st, GRID, 1)
        import random
        rnd = random.Random(1)
        perm = list(range(n)); rnd.shuffle(perm)
        for c in range(n):   # training: one per row/col (LHS)
            el(f'<circle cx="{a+(c+rnd.random())*st:.1f}" cy="{b+(perm[c]+rnd.random())*st:.1f}" r="4" fill="{MUT}" opacity=".55"/>')
        rnd2 = random.Random(9001); perm2 = list(range(n)); rnd2.shuffle(perm2)
        for c in range(n):   # test: separate sample
            el(f'<circle cx="{a+(c+rnd2.random())*st:.1f}" cy="{b+(perm2[c]+rnd2.random())*st:.1f}" r="5" fill="#FFFFFF" stroke="{ORG}" stroke-width="2.2"/>')
        ly = b + s + 26
        el(f'<circle cx="{a+4:.1f}" cy="{ly-4:.1f}" r="4" fill="{MUT}" opacity=".55"/>'); t(a + 13, ly, 'training designs', 12, MUT)
        el(f'<circle cx="{a+124:.1f}" cy="{ly-4:.1f}" r="5" fill="#FFFFFF" stroke="{ORG}" stroke-width="2.2"/>'); t(a + 134, ly, 'test designs', 12, ORG, 600)
    elif i == 1:
        cx = x + w / 2
        rect(cx - 48, y + 12, 96, 40, '#FFFFFF', ORG, 6, 2); t(cx, y + 30, 'test design', 12, ORG, 600, 'middle'); t(cx, y + 45, '(one of 101)', 11, MUT, 400, 'middle')
        for side, lab, sub, col in [(-1, 'EnergyPlus', 'reference', INK), (1, 'Surrogate', 'prediction', BLUE)]:
            bx = cx + side * 64 - 54
            line(cx, y + 52, cx + side * 64, y + 92, MUT, 1.4)
            rect(bx, y + 94, 108, 52, '#FFFFFF', col, 6, 1.6)
            t(bx + 54, y + 116, lab, 13.5, col, 700, 'middle'); t(bx + 54, y + 134, sub, 11.5, MUT, 400, 'middle')
            line(cx + side * 64, y + 146, cx + side * 20, y + 182, MUT, 1.4)
        rect(cx - 70, y + 184, 140, 40, TINT, None, 6)
        t(cx, y + 201, 'peak heating and', 12, BLUE, 600, 'middle'); t(cx, y + 216, 'cooling, each design day', 12, BLUE, 600, 'middle')
    elif i == 2:   # parity plot, real data
        a, b = x + 44, y + 8; s = min(w - 60, h - 46); vmax = 100.0
        X = lambda v: a + v / vmax * s; Y = lambda v: b + s - v / vmax * s
        pts = ' '.join('%.1f,%.1f' % (X(v), Y(v * 1.05)) for v in (0, vmax / 1.05)) + ' ' + ' '.join('%.1f,%.1f' % (X(v), Y(v * 0.95)) for v in (vmax, 0))
        el(f'<polygon points="{pts}" fill="{GOODT}"/>')
        for v in (0, 25, 50, 75, 100):
            line(a, Y(v), a + s, Y(v), GRID, 1); line(X(v), b, X(v), b + s, GRID, 1)
            t(a - 6, Y(v) + 4, str(v), 10.5, MUT, 400, 'end'); t(X(v), b + s + 14, str(v), 10.5, MUT, 400, 'middle')
        line(X(0), Y(0), X(vmax), Y(vmax), MUT, 1, '4 3')
        for r in OC['rows']:
            for lab, col in (('htg', ORG), ('clg', BLUE)):
                yv, pv, _ = r[lab]
                el(f'<circle cx="{X(yv):.1f}" cy="{Y(pv):.1f}" r="2.8" fill="{col}" opacity=".8"/>')
        t(a + s / 2, b + s + 30, 'EnergyPlus peak (W/m²)', 11.5, MUT, 400, 'middle')
        el(f'<text transform="translate({a-30:.1f},{b+s/2:.1f}) rotate(-90)" font-family="{FONT}" font-size="11.5" fill="{MUT}" text-anchor="middle">surrogate (W/m²)</text>')
        t(a + 8, b + 16, '● cooling', 11.5, BLUE, 600); t(a + 8, b + 31, '● heating', 11.5, ORG, 600)
    elif i == 3:   # histogram of cooling errors, real data
        errs = [r['clg'][2] for r in OC['rows']]
        bw = 1.0; nb = 10; counts = [0] * nb
        for e in errs: counts[min(int(e / bw), nb - 1)] += 1
        a, b = x + 36, y + 22; pw, ph = w - 52, h - 66
        cmax = max(counts); ymax = math.ceil(cmax / 10) * 10
        X = lambda v: a + v / (nb * bw) * pw; Y = lambda c: b + ph - c / ymax * ph
        for c in range(0, ymax + 1, 10):
            line(a, Y(c), a + pw, Y(c), GRID, 1); t(a - 6, Y(c) + 4, str(c), 10.5, MUT, 400, 'end')
        for k, c in enumerate(counts):
            if c: rect(X(k * bw) + 1.5, Y(c), pw / nb - 3, Y(0) - Y(c), BLUE, None, 2)
        for v in range(0, 11, 2): t(X(v), b + ph + 14, f'{v}%', 10.5, MUT, 400, 'middle')
        line(a, Y(0), a + pw, Y(0), MUT, 1.2)
        line(X(oc_clg_p95), b - 6, X(oc_clg_p95), Y(0), INK, 1.6, '4 3')
        t(X(oc_clg_p95) - 4, b - 10, f'P95 = {oc_clg_p95:.1f}%', 11.5, INK, 700, 'end')
        line(X(5), b - 6, X(5), Y(0), RED, 2)
        t(X(5) + 4, b - 10, 'limit 5%', 11.5, RED, 700)
        t(a + pw / 2, b + ph + 30, 'error of cooling peak, office, Chicago', 11.5, MUT, 400, 'middle')
        el(f'<text transform="translate({a-26:.1f},{b+ph/2:.1f}) rotate(-90)" font-family="{FONT}" font-size="11.5" fill="{MUT}" text-anchor="middle">test designs</text>')
    elif i == 4:   # decision
        cx = x + w / 2
        el(f'<polygon points="{cx},{y+6} {cx+78},{y+40} {cx},{y+74} {cx-78},{y+40}" fill="#FFFFFF" stroke="{INK}" stroke-width="1.6"/>')
        t(cx, y + 37, 'Worst P95', 12.5, INK, 700, 'middle'); t(cx, y + 53, '≤ 5% ?', 12.5, INK, 700, 'middle')
        for side, ok in ((-1, True), (1, False)):
            bx = cx + side * 66 - 62; col, tint = (GOOD, GOODT) if ok else (WARN, WARNT)
            line(cx + side * 78, y + 40, cx + side * 66, y + 92, MUT, 1.4)
            t(cx + side * 80, y + 74, 'yes' if ok else 'no', 11.5, MUT, 600, 'end' if ok else 'start')
            rect(bx, y + 94, 124, 128, tint, None, 6)
            m = OC if ok else SF
            t(bx + 62, y + 116, 'Shown as' if ok else 'Indicative', 13, col, 700, 'middle')
            t(bx + 62, y + 132, 'result' if ok else 'estimate ± error', 13, col, 700, 'middle')
            t(bx + 62, y + 158, 'e.g. office,' if ok else 'e.g. sports,', 11.5, INK, 400, 'middle')
            t(bx + 62, y + 173, 'Chicago' if ok else 'San Francisco', 11.5, INK, 400, 'middle')
            t(bx + 62, y + 200, f'{m["worst"]:.1f}%', 20, INK, 700, 'middle')
            t(bx + 62, y + 215, 'worst P95', 10.5, MUT, 400, 'middle')

if __name__ == '__main__':
    for i, (title, lines) in enumerate(panels):
        x = X0 + i * (PW + GAP)
        rect(x, Y0, PW, PH, PANEL, LINE, 10)
        el(f'<circle cx="{x+26:.1f}" cy="{Y0+32}" r="14" fill="{INK}"/>'); t(x + 26, Y0 + 37, str(i + 1), 14, '#FFFFFF', 700, 'middle')
        t(x + 48, Y0 + 37.5, title, 16 if len(title) < 24 else 15, INK, 700)
        rect(x + 14, FIG_Y - 6, PW - 28, FIG_H + 22, '#FFFFFF', None, 6)
        sketch(i, x + 14, FIG_Y, PW - 28, FIG_H)
        for k, ln in enumerate(lines): t(x + 18, FIG_Y + FIG_H + 50 + k * 21, ln, 14, MUT)
        if i < 4:
            ax = x + PW + 6; ay = Y0 + PH / 2 - 30
            line(ax, ay, ax + GAP - 16, ay, INK, 2)
            el(f'<polygon points="{ax+GAP-12:.1f},{ay} {ax+GAP-22:.1f},{ay-6} {ax+GAP-22:.1f},{ay+6}" fill="{INK}"/>')
    by = Y0 + PH + 26
    el(f'<path d="M{X0+4},{by-10} V{by} H{X0+5*PW+4*GAP-4} V{by-10}" fill="none" stroke="{MUT}" stroke-width="1.5"/>')
    t(X0 + (5 * PW + 4 * GAP) / 2, by + 26, 'Repeated for every one of the 243 models (9 building types × 27 cities) after each refit', 15, INK, 600, 'middle')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="#FFFFFF"/>' + ''.join(out) + '</svg>'
    open(sys.argv[1], 'w').write(svg)
