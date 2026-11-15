#!/bin/bash
# Vytvoří složku navrh/ = kopie sandboxu (stav rádia), do které Claude zapíše navrhované úpravy.
# Použití: tools/novy-navrh.sh 2.13 "Popis návrhu"
set -e
cd "$(dirname "$0")/.."
VER="$1"; TITLE="${2:-Návrh $1}"
[ -n "$VER" ] || { echo "Chybí verze"; exit 1; }
rm -rf navrh && mkdir -p navrh
cp -r js assets style.css radio-state.json navrh/
sed -e 's#href="fonts/#href="../fonts/#; s#href="manifest.webmanifest"#href="../manifest.webmanifest"#; s#href="icons/#href="../icons/#g' index.html > navrh/index.html
sed -i "s#const APP_VERSION = '[^']*'#const APP_VERSION = '$VER'#; s#const APP_BUILD = [0-9]*#const APP_BUILD = 1#" navrh/js/core.js
python3 - "$VER" "$TITLE" <<'PY'
import json, sys, datetime
ver, title = sys.argv[1], sys.argv[2]
now = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
json.dump({"version": ver, "branch": "navrh-" + ver, "title": title, "created": now, "notes": []}, open('navrh/proposal.json', 'w'), ensure_ascii=False, indent=2)
v = json.load(open('version.json')); v.update(version=ver, radioVersion=ver, build=1, notes=[])
json.dump(v, open('navrh/version.json', 'w'), ensure_ascii=False, indent=2)
r = json.load(open('navrh/radio-state.json')); r['radioVersion'] = ver; r['capturedAt'] = now
json.dump(r, open('navrh/radio-state.json', 'w'), ensure_ascii=False, indent=1)
PY
echo "Hotovo: navrh/ pro verzi $VER – teď uprav soubory v navrh/ a doplň notes v navrh/proposal.json a navrh/version.json."
