#!/usr/bin/env python3
"""Compare the six Phase 0 PNG pairs pixel-for-pixel.

The command exits non-zero when a file is missing, dimensions differ, or
even one RGBA pixel differs. It deliberately has no tolerance setting.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image


EXPECTED_FILES = (
    "home-390.png",
    "home-1440.png",
    "book-390.png",
    "book-1440.png",
    "admin-390.png",
    "admin-1440.png",
)


def changed_pixels(before_path: Path, after_path: Path) -> int:
    with Image.open(before_path) as before_image, Image.open(after_path) as after_image:
        before = before_image.convert("RGBA")
        after = after_image.convert("RGBA")
        if before.size != after.size:
            raise ValueError(f"size mismatch: {before.size} != {after.size}")
        return sum(left != right for left, right in zip(before.getdata(), after.getdata()))


def compare_directories(before_dir: Path, after_dir: Path) -> int:
    failed = False
    for filename in EXPECTED_FILES:
        before_path = before_dir / filename
        after_path = after_dir / filename
        missing = [str(path) for path in (before_path, after_path) if not path.is_file()]
        if missing:
            print(f"{filename}: missing={','.join(missing)}")
            failed = True
            continue
        try:
            count = changed_pixels(before_path, after_path)
        except (OSError, ValueError) as exc:
            print(f"{filename}: error={exc}")
            failed = True
            continue
        print(f"{filename}: diff_pixels={count}")
        failed = failed or count != 0
    return 1 if failed else 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before_dir", type=Path)
    parser.add_argument("after_dir", type=Path)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    sys.exit(compare_directories(arguments.before_dir, arguments.after_dir))
