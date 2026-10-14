#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from urllib.parse import urlparse, unquote

# Attributes that commonly contain file paths in HTML
ATTRS = ("src", "href", "data-src", "data-href", "poster")

# crude but effective attribute matcher: attr="..."/attr='...'
ATTR_RE = re.compile(
    r"""(?P<attr>src|href|data-src|data-href|poster)\s*=\s*(?P<q>["'])(?P<val>.*?)(?P=q)""",
    re.IGNORECASE,
)

# ignore these schemes (external/non-file)
IGNORE_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


def extract_local_paths_from_html(html_text: str) -> set[str]:
    paths: set[str] = set()

    for m in ATTR_RE.finditer(html_text):
        raw = m.group("val").strip()
        if not raw:
            continue

        # strip fragments/query
        # urlparse handles ? and # nicely
        parsed = urlparse(raw)
        if parsed.scheme and parsed.scheme.lower() in IGNORE_SCHEMES:
            continue

        # If it's a protocol-relative URL like //example.com/...
        if raw.startswith("//"):
            continue

        # Take the path part and decode %20 etc.
        p = unquote(parsed.path).strip()

        # ignore anchors / empty / hash-only
        if not p or p.startswith("#"):
            continue

        # normalize: remove leading "/" (treat as repo-relative)
        p = p.lstrip("/")

        paths.add(p)

    return paths


def gather_referenced_files(html_files: list[Path], repo_root: Path) -> set[Path]:
    referenced: set[Path] = set()

    for html_file in html_files:
        text = html_file.read_text(encoding="utf-8", errors="ignore")
        rel_paths = extract_local_paths_from_html(text)

        for rel in rel_paths:
            # Resolve relative to repo root (your HTML uses repo-relative paths like images/...)
            candidate = (repo_root / rel).resolve()

            # keep only things inside repo root
            try:
                candidate.relative_to(repo_root.resolve())
            except ValueError:
                continue

            referenced.add(candidate)

    return referenced


def iter_files_under(folder: Path) -> list[Path]:
    return [p for p in folder.rglob("*") if p.is_file()]


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Delete files under a folder that are not referenced in given HTML files."
    )
    ap.add_argument(
        "--root",
        default=".",
        help="Repo root to resolve paths against (default: .)",
    )
    ap.add_argument(
        "--html",
        nargs="+",
        required=True,
        help="HTML file(s) to scan, e.g. html/galleries/slovenia.html",
    )
    ap.add_argument(
        "--target",
        required=True,
        help="Folder to clean, e.g. images/slovenia",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not delete; just print what would be deleted.",
    )
    ap.add_argument(
        "--keep",
        nargs="*",
        default=[],
        help="Extra file paths to always keep (relative to root).",
    )
    ap.add_argument(
        "--ext",
        nargs="*",
        default=[],
        help="If provided, only consider deleting these extensions (e.g. .jpg .png).",
    )

    args = ap.parse_args()

    repo_root = Path(args.root).resolve()
    html_files = [Path(h).resolve() if Path(h).is_absolute() else (repo_root / h).resolve() for h in args.html]
    target = (repo_root / args.target).resolve()

    if not target.exists() or not target.is_dir():
        raise SystemExit(f"Target folder not found or not a directory: {target}")

    for h in html_files:
        if not h.exists():
            raise SystemExit(f"HTML file not found: {h}")

    referenced = gather_referenced_files(html_files, repo_root)

    # Add manual keep list
    for k in args.keep:
        kp = (repo_root / k).resolve()
        referenced.add(kp)

    # Build delete list
    all_files = iter_files_under(target)

    # Optional extension filter
    exts = {e.lower() if e.startswith(".") else f".{e.lower()}" for e in args.ext}

    to_delete: list[Path] = []
    for f in all_files:
        if exts and f.suffix.lower() not in exts:
            continue
        if f.resolve() not in referenced:
            to_delete.append(f)

    # Output
    print(f"Repo root : {repo_root}")
    print(f"HTML files: {', '.join(str(h) for h in html_files)}")
    print(f"Target    : {target}")
    print(f"Referenced files found: {len(referenced)}")
    print(f"Files in target: {len(all_files)}")
    print(f"Would delete: {len(to_delete)}")
    print()

    for f in to_delete:
        rel = f.resolve().relative_to(repo_root)
        print(f"DELETE: {rel}")

    if args.dry_run:
        print("\nDry-run: no files deleted.")
        return

    # Delete
    for f in to_delete:
        f.unlink()

    print("\nDone. Deleted files:", len(to_delete))


if __name__ == "__main__":
    main()