#!/usr/bin/env python3
"""Download online public painting previews to local gallery assets.

Only use for works whose reproduction permissions are already held by curator.
Preserves original source attribution, and NEVER overrides manually uploaded
assets. Network errors are reported, not treated as completed uploads.
"""
from __future__ import annotations
import io
import json
import re
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "data" / "artists.json"
ART_DIR = ROOT / "assets" / "works"
REPORT = ROOT / "data" / "image_sync_report.json"
ART_DIR.mkdir(parents=True, exist_ok=True)
USER_AGENT = "Mozilla/5.0 (compatible; NEXORA-Art-Museum/1.0; curator-operated)"
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}
MAX_DOWNLOAD = 12 * 1024 * 1024
MAX_SIDE = 1600
outcomes = []

def get_image(url: str, source: str | None) -> Image.Image:
    headers = dict(HEADERS)
    if source and source.startswith("https://"):
        headers["Referer"] = source
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=14) as response:
        mime = response.headers.get("Content-Type", "")
        if "image/" not in mime.lower() and mime:
            raise ValueError("non-image response: " + mime)
        raw = response.read(MAX_DOWNLOAD + 1)
        if len(raw) > MAX_DOWNLOAD:
            raise ValueError("image larger than allowed size")
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        if im.width < 180 or im.height < 180:
            raise ValueError("source too small for exhibition")
        return ImageOps.exif_transpose(im).convert("RGB")

def sync():
    obj = json.loads(INDEX.read_text(encoding="utf-8"))
    for artist in obj["artists"]:
        name = artist["name"]
        for work in artist.get("works", [])[:1]:
            src = work.get("image_url") or ""
            target = ART_DIR / ("artist-%02d-1.webp" % artist["exhibition_order"])
            # Local original assets, once inserted, take precedence.
            if work.get("file_uploaded") and work.get("image_path") and (ROOT / work["image_path"]).exists():
                outcomes.append(dict(artist=name, title=work.get("title"), status="preserved", path=work["image_path"]))
                continue
            if target.exists():
                work["image_path"] = target.relative_to(ROOT).as_posix()
                work["file_uploaded"] = True
                work["image_status"] = "GitHub repository local optimized image"
                outcomes.append(dict(artist=name, title=work.get("title"), status="present", path=work["image_path"]))
                continue
            if not src.startswith("https://"):
                outcomes.append(dict(artist=name, title=work.get("title"), status="missing", message="No source URL"))
                continue
            try:
                im = get_image(src, work.get("source_url"))
                im.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
                im.save(target, "WEBP", quality=84, method=6, optimize=True)
                work["image_path"] = target.relative_to(ROOT).as_posix()
                work["file_uploaded"] = True
                work["image_status"] = "Downloaded and optimized preview; source attributed"
                outcomes.append(dict(artist=name, title=work.get("title"), status="downloaded", path=work["image_path"], dimensions=list(im.size), bytes=target.stat().st_size))
            except (Exception) as error:
                work["file_uploaded"] = False
                outcomes.append(dict(artist=name, title=work.get("title"), status="failed", source_url=work.get("source_url"), message=str(error)[:250]))
            time.sleep(.15)
    INDEX.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # The two websites embed data into their HTML for zero-network deployment.
    for name in ("index.html", "3d/index.html"):
        path = ROOT / name
        html = path.read_text(encoding="utf-8")
        if name == "index.html":
            start_tag, end_tag = "let records=", ";const grid="
            payload = obj["artists"]
        else:
            start_tag, end_tag = "const artists=", ";let pos=0;"
            payload = [
                dict(name=a["name"], cat=a["gallery"], theme=a["key_theme"],
                     note=a["curatorial_note"], work=a["works"][0] if a.get("works") else {})
                for a in obj["artists"]
            ]
        a = html.find(start_tag)
        b = html.find(end_tag, a)
        if a == -1 or b == -1:
            outcomes.append(dict(artist="_site_", status="warning", message="Could not sync " + name))
            continue
        html = html[:a] + start_tag + json.dumps(payload, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c") + html[b:]
        # Use local copies preferentially; retain remote URLs as fallback.
        if name == "index.html":
            html = html.replace("w.image_url||w.image_path", "(w.file_uploaded&&w.image_path?w.image_path:w.image_url||w.image_path)")
            html = html.replace("lead.image_url", "(lead.file_uploaded&&lead.image_path?lead.image_path:lead.image_url)")
        else:
            html = html.replace("a.work?.image_url||null", "(a.work?.file_uploaded&&a.work?.image_path?'../'+a.work.image_path:a.work?.image_url)||null")
        path.write_text(html, encoding="utf-8")
    success = sum(x["status"] in ("downloaded", "present", "preserved") for x in outcomes)
    REPORT.write_text(json.dumps({"total_artists":len(obj["artists"]),"local_images":success,"results":outcomes}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("NEXORA LOCAL ARTWORK SYNC: " + str(success) + "/"+str(len(obj["artists"])))
    for o in outcomes:print(o["artist"]+" | "+o["status"]+" | "+o.get("message",""))

if __name__ == "__main__":
    sync()
