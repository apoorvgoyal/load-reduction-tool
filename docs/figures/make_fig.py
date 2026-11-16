# Report figure: surrogate-model workflow (build). Writes the SVG named on the command line.
import sys, math
INK='#15202B'; MUT='#5A6875'; BLUE='#1D5FB4'; TINT='#E8F0FB'; ORG='#B4500F'; PANEL='#F4F6F8'; LINE='#C9D2DB'; GRID='#DDE4EA'
FONT="Helvetica, Arial, sans-serif"
W, H = 1624, 530
PW, GAP, X0, Y0, PH = 236, 38, 12, 16, 400
out = []
def t(x, y, s, size=15, fill=INK, w=400, anchor='start', style=''):
    out.append(f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{w}" fill="{fill}" text-anchor="{anchor}"{style}>{s}</text>')
def el(s): out.append(s)

panels = [
 ('Multiple variables', ['20 inputs that move the', 'heating or cooling peak']),
 ('Design space', ['Each input is one axis with a', 'min–max range: every design is', 'a point in a 20-D space']),
 ('Latin hypercube sampling', ['1,000–5,500 designs per', 'model, covering every', 'range evenly']),
 ('EnergyPlus simulation', ['ASHRAE heating and cooling', 'design days; peak = highest', 'one-hour average']),
 ('Fitting', ['26 physics features; quadratic', 'or neural-network model,', 'chosen by cross-validation']),
 ('Surrogate model', ['Instant heating and cooling', 'peaks, tested on independent', 'EnergyPlus runs']),
]
FIG_Y, FIG_S = Y0 + 70, 180   # sketch box top / size (square)

def sketch(i, ox, oy):
    s = FIG_S / 120.0
    g = lambda x, y: (ox + x * s, oy + y * s)
    if i == 0:
        items = ['Envelope U-values', 'Glazing and SHGC', 'Shading', 'Lighting and equipment', 'Occupancy', 'Fresh air, heat recovery', 'Airtightness', 'Setpoints', 'Size, shape, orientation']
        for k, lab in enumerate(items):
            y = oy + 4 + k * 19.6
            el(f'<rect x="{ox+2}" y="{y:.1f}" width="{FIG_S-4}" height="15" rx="3" fill="{TINT}"/>')
            t(ox + 9, y + 11.3, lab, 11, BLUE, 500)
    elif i == 1:
        L = 64 * s; D = 0.58 * L; ang = math.radians(35)
        x0, y0 = ox + 14 * s, oy + 97 * s
        def P(a, b, c):   # a: right, b: depth (up-right), c: up; all 0..1
            return (x0 + a * L + b * D * math.cos(ang), y0 - c * L - b * D * math.sin(ang))
        def edge(p, q, dash=False):
            (x1, y1), (x2, y2) = P(*p), P(*q)
            el(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{MUT}" stroke-width="{1 if dash else 1.4}"' + (' stroke-dasharray="3 3"' if dash else '') + '/>')
        for q in [(1,1,0), (0,0,0), (0,1,1)]:
            edge((0,1,0), q, True)
        n = 5; pts = [(a/(n-1), b/(n-1), c/(n-1)) for a in range(n) for b in range(n) for c in range(n)]
        pts.sort(key=lambda q: -q[1])   # back to front
        for a, b, c in pts:
            X, Y = P(a, b, c)
            el(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="{3.1 - 1.3 * b:.2f}" fill="{BLUE}" opacity="{0.95 - 0.6 * b:.2f}"/>')
        for p_, q_ in [((0,0,0),(1,0,0)), ((1,0,0),(1,1,0)), ((1,0,0),(1,0,1)), ((1,1,0),(1,1,1)),
                       ((0,0,0),(0,0,1)), ((0,0,1),(1,0,1)), ((0,0,1),(0,1,1)), ((1,0,1),(1,1,1)), ((0,1,1),(1,1,1))]:
            edge(p_, q_)
        X, Y = P(0.5, 0, 0); t(X, Y + 15, 'Glazing %', 11, INK, 600, 'middle')
        X, Y = P(0, 0, 0.5); t(X - 6, Y + 4, 'Wall U', 11, INK, 600, 'end')
        X, Y = P(1, 0.5, 0); t(X + 8, Y + 12, 'Lighting', 11, INK, 600, 'start')
        t(ox + FIG_S / 2, oy + 121 * s, '3 of the 20 dimensions', 11, MUT, 400, 'middle')
    elif i == 2:
        n = 8; a, b = 10, 110; st = (b - a) / n
        for k in range(n + 1):
            v = a + k * st
            el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1"/>' % (*g(v, a), *g(v, b), GRID))
            el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1"/>' % (*g(a, v), *g(b, v), GRID))
        rows = [4, 7, 1, 5, 0, 3, 6, 2]   # one point in every row and column
        jit = [.3, .55, .4, .45, .5, .35, .6, .7]
        for c, r in enumerate(rows):
            X, Y = g(a + (c + jit[c]) * st, a + (r + jit[(c+3)%8]) * st)
            el(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4.6" fill="{BLUE}"/>')
        t(g(60,0)[0], g(0,121)[1], 'two of the 20 dimensions', 11, MUT, 400, 'middle')
    elif i == 3:
        el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.2"/>' % (*g(10, 100), *g(112, 100), MUT))
        el('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" opacity=".18"/>' % (*g(68, 22), 16*s, 78*s, BLUE))
        pts = ' '.join('%.1f,%.1f' % g(x, y) for x, y in [(10,92),(20,92),(28,90),(36,84),(44,70),(52,58),(60,46),(68,36),(76,30),(84,32),(92,44),(100,66),(108,86),(112,90)])
        el(f'<polyline fill="none" stroke="{BLUE}" stroke-width="2.6" stroke-linejoin="round" points="{pts}"/>')
        pts = ' '.join('%.1f,%.1f' % g(x, y) for x, y in [(10,40),(30,42),(44,60),(60,78),(80,82),(96,70),(112,44)])
        el(f'<polyline fill="none" stroke="{ORG}" stroke-width="2.2" stroke-dasharray="4 4" points="{pts}"/>')
        X, Y = g(76, 30); el(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4.4" fill="{BLUE}"/>')
        t(*g(76, 16), 'peak (1-h avg)', 11, INK, 600, 'middle')
        t(*g(10, 112), '0 h', 11, MUT); t(*g(112, 112), '24 h', 11, MUT, 400, 'end')
        t(*g(10, 121), '— cooling day', 11, BLUE, 500); t(*g(112, 121), '- - heating day', 11, ORG, 500, 'end')
    elif i == 4:
        el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.2"/>' % (*g(14, 104), *g(112, 104), MUT))
        el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1.2"/>' % (*g(14, 104), *g(14, 8), MUT))
        el('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="1" stroke-dasharray="3 3"/>' % (*g(14, 104), *g(110, 8), MUT))
        for x, y in [(24,94),(30,90),(35,84),(41,80),(44,77),(47,71),(52,69),(58,61),(63,58),(66,55),(68,51),(74,47),(79,40),(85,36),(90,30),(96,25),(101,19)]:
            X, Y = g(x, y); el(f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="3.2" fill="{BLUE}" opacity=".85"/>')
        t(*g(112, 116), 'EnergyPlus peak', 11, MUT, 400, 'end')
        t(*g(18, 12), 'surrogate prediction', 11, MUT)
    elif i == 5:
        for k, (lab, val, col) in enumerate([('Peak cooling', '100 tons', BLUE), ('Peak heating', '1,295 MBH', ORG)]):
            X, Y = g(6, 10 + k * 50)
            el(f'<rect x="{X:.1f}" y="{Y:.1f}" width="{108*s:.1f}" height="{42*s:.1f}" rx="6" fill="#FFFFFF" stroke="{LINE}"/>')
            t(X + 12, Y + 24, lab, 12, col, 600); t(X + 12, Y + 52, val, 22, INK, 700)
        t(*g(60, 116), 'example output', 11, MUT, 400, 'middle')

if __name__ == '__main__':
    for i, (title, lines) in enumerate(panels):
        x = X0 + i * (PW + GAP)
        last = i == 5
        el(f'<rect x="{x:.1f}" y="{Y0}" width="{PW}" height="{PH}" rx="10" fill="{PANEL}" stroke="{BLUE if last else LINE}" stroke-width="{2 if last else 1}"/>')
        el(f'<circle cx="{x+26:.1f}" cy="{Y0+32}" r="14" fill="{INK}"/>')
        t(x + 26, Y0 + 37, str(i + 1), 14, '#FFFFFF', 700, 'middle')
        t(x + 48, Y0 + 37.5, title, 16 if len(title) < 22 else 14.5, INK, 700)
        el(f'<rect x="{x+16:.1f}" y="{FIG_Y-6}" width="{PW-32}" height="{FIG_S+40}" rx="6" fill="#FFFFFF"/>')
        sketch(i, x + (PW - FIG_S) / 2, FIG_Y + 4)
        for k, ln in enumerate(lines):
            t(x + 18, FIG_Y + FIG_S + 66 + k * 21, ln, 14, MUT)
        if i < 5:
            ax = x + PW + 8; ay = Y0 + PH / 2 - 40
            el(f'<line x1="{ax:.1f}" y1="{ay}" x2="{ax+GAP-18:.1f}" y2="{ay}" stroke="{INK}" stroke-width="2"/>')
            el(f'<polygon points="{ax+GAP-16:.1f},{ay} {ax+GAP-26:.1f},{ay-6} {ax+GAP-26:.1f},{ay+6}" fill="{INK}"/>')
    by = Y0 + PH + 26
    x1, x2 = X0, X0 + 4 * (PW + GAP) + PW
    el(f'<path d="M{x1+4},{by-10} V{by} H{x2-4} V{by-10}" fill="none" stroke="{MUT}" stroke-width="1.5"/>')
    t((x1 + x2) / 2, by + 26, 'Done once per building type × city, ahead of time (9 types × 27 cities = 243 models)', 15, INK, 600, 'middle')
    x3, x4 = X0 + 5 * (PW + GAP), X0 + 5 * (PW + GAP) + PW
    el(f'<path d="M{x3+4},{by-10} V{by} H{x4-4} V{by-10}" fill="none" stroke="{BLUE}" stroke-width="1.5"/>')
    t((x3 + x4) / 2, by + 26, 'Used in the tool, instantly', 15, BLUE, 600, 'middle')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="#FFFFFF"/>' + ''.join(out) + '</svg>'
    open(sys.argv[1], 'w').write(svg)
