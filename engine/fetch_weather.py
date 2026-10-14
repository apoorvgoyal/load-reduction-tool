"""Download the .ddy and .stat files for every station in stations.json.

Usage:  python3 engine/fetch_weather.py [--force]

Files land in engine/weather/. They are small (~30-40 kB each) and are committed
so the pipeline is reproducible without network access.
"""
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'weather')


def main(argv):
    force = '--force' in argv
    with open(os.path.join(HERE, 'stations.json')) as f:
        manifest = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    for st in manifest['stations']:
        stem = os.path.basename(st['path'])
        for ext in ('ddy', 'stat'):
            dest = os.path.join(OUT, stem + '.' + ext)
            if os.path.exists(dest) and not force:
                continue
            url = '%s/%s/%s.%s' % (manifest['base_url'], st['path'], stem, ext)
            print('fetch', url)
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
            with open(dest, 'wb') as f:
                f.write(data)


if __name__ == '__main__':
    main(sys.argv[1:])
