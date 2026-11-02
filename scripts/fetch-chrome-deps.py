#!/usr/bin/env python3
"""جلب حزم .deb مباشرة من أرشيف أوبنتو نوبل واستخراجها محلياً بدون root."""
import gzip, io, os, subprocess, sys, urllib.request

BASE = "http://archive.ubuntu.com/ubuntu/dists/noble/"
COMPONENTS = ["main", "universe"]
WANT = {
    "libnspr4", "libnss3", "libatk1.0-0t64", "libatk-bridge2.0-0t64",
    "libatspi2.0-0t64", "libxcomposite1", "libxdamage1", "libxfixes3",
    "libxrandr2", "libasound2t64", "libxkbcommon0", "libcups2t64",
    "libpango-1.0-0", "libcairo2",
}

os.makedirs("/workspace/homes/07e17fba734428ba794795ea/debs", exist_ok=True)
found = {}
for comp in COMPONENTS:
    url = BASE + comp + "/binary-amd64/Packages.gz"
    print("fetching index", comp, "...")
    with urllib.request.urlopen(url, timeout=60) as r:
        data = gzip.decompress(r.read()).decode("utf-8", "replace")
    for block in data.split("\n\n"):
        if not block.strip():
            continue
        pkg = filename = None
        for line in block.splitlines():
            if line.startswith("Package: "):
                pkg = line[9:].strip()
            elif line.startswith("Filename: "):
                filename = line[10:].strip()
        if pkg in WANT and pkg not in found and filename:
            found[pkg] = filename

missing = WANT - set(found)
if missing:
    print("NOT FOUND:", sorted(missing)); sys.exit(1)

debdir = "/workspace/homes/07e17fba734428ba794795ea/debs"
libdir = "/workspace/homes/07e17fba734428ba794795ea/libs"
os.makedirs(libdir, exist_ok=True)
for pkg, fname in sorted(found.items()):
    url = "http://archive.ubuntu.com/ubuntu/" + fname
    base = os.path.basename(fname)
    debpath = os.path.join(debdir, base)
    if not os.path.exists(debpath):
        print("downloading", pkg, "...")
        urllib.request.urlretrieve(url, debpath)
    subprocess.run(["dpkg-deb", "-x", debpath, libdir], check=True)
print("DONE — extracted to", libdir)
