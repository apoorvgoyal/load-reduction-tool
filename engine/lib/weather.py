"""Parsers for EnergyPlus .ddy (design day) and .stat (climate summary) files.

Nothing here invents a value: every number returned is read from the file.
"""
import re

# Design-day families this tool uses. Keys are stable identifiers used in the
# results JSON, the surrogate, and the UI.
#   htg_99.6 / htg_99        heating dry-bulb
#   clg_db_0.4 / 1 / 2       cooling dry-bulb with mean coincident wet-bulb
#   clg_dp_0.4 / 1 / 2       cooling dew-point with mean coincident dry-bulb
#                            (the dehumidification design condition)
_DD_PATTERNS = [
    ('htg_99.6', re.compile(r'Ann Htg 99\.6% Condns DB$')),
    ('htg_99', re.compile(r'Ann Htg 99% Condns DB$')),
    ('clg_db_0.4', re.compile(r'Ann Clg \.4% Condns DB=>MWB$')),
    ('clg_db_1', re.compile(r'Ann Clg 1% Condns DB=>MWB$')),
    ('clg_db_2', re.compile(r'Ann Clg 2% Condns DB=>MWB$')),
    ('clg_dp_0.4', re.compile(r'Ann Clg \.4% Condns DP=>MDB$')),
    ('clg_dp_1', re.compile(r'Ann Clg 1% Condns DP=>MDB$')),
    ('clg_dp_2', re.compile(r'Ann Clg 2% Condns DP=>MDB$')),
]
DESIGN_DAY_KEYS = [k for k, _ in _DD_PATTERNS]


def _read_text(path):
    # .ddy/.stat files contain Latin-1 degree signs.
    with open(path, 'rb') as f:
        return f.read().decode('latin-1')


def parse_idf_objects(text):
    """Split IDF-format text into objects.

    Returns a list of (type, fields, labels) where fields are raw strings and
    labels are the `!-` comments (lower-cased, unit suffix stripped) when present.
    """
    objs = []
    cur_vals, cur_labels = [], []
    for raw in text.splitlines():
        line = raw
        label = ''
        if '!' in line:
            idx = line.index('!')
            comment = line[idx:]
            line = line[:idx]
            if comment.startswith('!-'):
                label = comment[2:].strip()
        line = line.strip()
        if not line:
            continue
        # A line may carry several fields separated by commas, ending with ; or ,
        parts = re.split(r'([,;])', line)
        tokens = []
        for i in range(0, len(parts) - 1, 2):
            tokens.append((parts[i].strip(), parts[i + 1]))
        tail = parts[-1].strip() if len(parts) % 2 == 1 else ''
        if tail:
            tokens.append((tail, None))
        for n, (val, sep) in enumerate(tokens):
            cur_vals.append(val)
            # The !- label belongs to the last field on the line.
            cur_labels.append(label if n == len(tokens) - 1 else '')
            if sep == ';':
                objs.append((cur_vals[0], cur_vals[1:], cur_labels[1:]))
                cur_vals, cur_labels = [], []
    return objs


def _norm_label(label):
    label = re.sub(r'\{.*$', '', label).strip().lower()
    return label


def _num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def parse_ddy(path):
    """Return dict with location, dst, and design days keyed by DESIGN_DAY_KEYS.

    Each design day keeps the verbatim field list (for writing back to IDF) and
    a decoded summary used for display.
    """
    text = _read_text(path)
    objs = parse_idf_objects(text)
    out = {'location': None, 'dst': None, 'design_days': {}, 'source_note': None}
    m = re.search(r'Data Source=([^\r\n]+)', text)
    if m:
        out['source_note'] = m.group(1).strip()
    for typ, fields, labels in objs:
        t = typ.lower()
        if t == 'site:location':
            out['location'] = {
                'name': fields[0],
                'latitude': _num(fields[1]),
                'longitude': _num(fields[2]),
                'time_zone': _num(fields[3]),
                'elevation_m': _num(fields[4]),
                'fields': fields,
            }
        elif t == 'runperiodcontrol:daylightsavingtime':
            out['dst'] = fields
        elif t == 'sizingperiod:designday':
            name = fields[0]
            for key, pat in _DD_PATTERNS:
                if pat.search(name):
                    lab = {_norm_label(l): v for l, v in zip(labels, fields) if l}
                    out['design_days'][key] = {
                        'name': name,
                        'fields': fields,
                        'month': int(float(fields[1])),
                        'day': int(float(fields[2])),
                        'max_db_c': _num(fields[4]),
                        'db_range_c': _num(fields[5]),
                        'humidity_type': fields[8],
                        'humidity_value': _num(fields[9]),
                        'pressure_pa': _num(fields[14]),
                        'wind_mps': _num(fields[15]),
                        'solar_model': fields[20] if len(fields) > 20 else '',
                        'labels_found': bool(lab),
                    }
                    break
    return out


def parse_stat(path):
    """Extract ASHRAE climate zone and monthly 0.5 m ground temperatures."""
    text = _read_text(path)
    out = {'climate_zone': None, 'ground_temps_0p5m': None}
    m = re.search(r'Climate type "([0-9][A-C]?)" \(ASHRAE Standards? [^)]*Climate Zone\)', text)
    if m:
        out['climate_zone'] = m.group(1)
    m = re.search(r'Monthly Calculated "undisturbed" Ground Temperatures.*?\n(.*?)\n(.*?)\n', text, re.S)
    if m:
        row = m.group(2)
        vals = re.findall(r'-?\d+\.\d+', row.split('m', 1)[1] if 'm' in row else row)
        if '0.5 m' in row and len(vals) == 12:
            out['ground_temps_0p5m'] = [float(v) for v in vals]
    return out
