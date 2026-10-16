"""Locating and loading batch result files.

A building type x station can have several result files: the plain one
(`office__chicago.jsonl`) and one per shard when the work was split across
machines (`office__chicago.shard-2-of-4.jsonl`). Copy every machine's
files into one engine/runs/ folder and they are merged here, de-duplicated by
sample id. Failure logs (`*.failed.jsonl`) are never treated as results.
"""
import glob
import json
import os
import re

_NAME = re.compile(r'^(?P<type>[a-z0-9_]+?)__(?P<station>[a-z0-9_]+?)(\.shard-\d+-of-\d+)?\.jsonl$')


def parse_name(path):
    """(type, station) for a result file name, or None for anything else."""
    base = os.path.basename(path)
    if base.endswith('.failed.jsonl'):
        return None
    m = _NAME.match(base)
    return (m.group('type'), m.group('station')) if m else None


def result_file(runs_dir, btype, station, shard=None):
    if shard:
        k, n = shard
        return os.path.join(runs_dir, '%s__%s.shard-%d-of-%d.jsonl' % (btype, station, k, n))
    return os.path.join(runs_dir, '%s__%s.jsonl' % (btype, station))


def files_for(runs_dir, btype, station):
    pattern = os.path.join(runs_dir, '%s__%s*.jsonl' % (btype, station))
    return sorted(f for f in glob.glob(pattern) if parse_name(f) == (btype, station))


def pairs(runs_dir):
    """Every (type, station) with at least one result file."""
    return sorted({p for p in (parse_name(f) for f in glob.glob(os.path.join(runs_dir, '*.jsonl'))) if p})


def load(paths):
    """Records from all files, one per sample id (a later file wins)."""
    by_id = {}
    for p in paths:
        with open(p) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except ValueError:
                    continue          # a line cut short by an interrupted run
                by_id[rec['id']] = rec
    return [by_id[k] for k in sorted(by_id)]


def parse_shard(text):
    """'2/4' -> (2, 4)."""
    m = re.match(r'^\s*(\d+)\s*/\s*(\d+)\s*$', text or '')
    if not m:
        raise ValueError("shard must look like K/N, e.g. 2/4")
    k, n = int(m.group(1)), int(m.group(2))
    if not 1 <= k <= n:
        raise ValueError('shard K must be between 1 and N')
    return k, n
