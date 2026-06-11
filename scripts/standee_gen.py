#!/usr/bin/env python3
"""
MooLah 立牌內卡產生器
吃「店名 + 職人名 + shortCode」→ 自動生 QR + 套進固定深色模板 → 輸出印刷用 JPG。
木底座壓克力夾的「可抽換內卡」用。

用法：
  python3 standee_gen.py --store "沐光髮藝" --designer "設計師 林沐" --short linmu
  python3 standee_gen.py --store "Studio Lumi" --designer "Emily" --url https://moolah-platform.vercel.app/go/emily --size A5
"""
import argparse, os
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont

# 官網品牌色
BG    = (26, 23, 20)      # #1a1714 深炭
CREAM = (251, 249, 244)   # #fbf9f4 米白
GOLD  = (166, 137, 102)   # #A68966 橡木金
PANEL = (245, 240, 231)   # QR 底卡（略暖白，掃碼對比足）

FONT = "/System/Library/Fonts/PingFang.ttc"  # 中英通用
IDX  = {"regular": 1, "medium": 4, "semibold": 7}  # PingFang TC

# A 系列直式像素（300 DPI，無出血，夾入式不需出血）
SIZES = {"A6": (1240, 1748), "A5": (1748, 2480), "A4": (2480, 3508)}

BASE_URL = "https://moolah-platform.vercel.app/go/"


def font(weight, px):
    return ImageFont.truetype(FONT, px, index=IDX[weight])


def fit_font(draw, text, weight, max_px, max_w):
    """字太長自動縮，回傳能塞進 max_w 的字型"""
    px = max_px
    while px > 10:
        f = font(weight, px)
        if draw.textlength(text, font=f) <= max_w:
            return f
        px -= 4
    return font(weight, px)


def center(draw, text, f, y, fill, W):
    w = draw.textlength(text, font=f)
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)


def make_qr(url, target_px):
    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_H, box_size=10, border=2)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color=(26, 23, 20), back_color=PANEL).convert("RGB")
    return img.resize((target_px, target_px), Image.NEAREST)


def generate(store, designer, url, size="A6", outdir="."):
    W, H = SIZES[size]
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    m = int(W * 0.09)

    # 1) MooLah 字標
    center(d, "MooLah", font("semibold", int(W * 0.058)), int(H * 0.060), GOLD, W)
    # 分隔線
    dl = int(W * 0.10); cy = int(H * 0.118)
    d.line([(W / 2 - dl, cy), (W / 2 + dl, cy)], fill=GOLD, width=3)

    # 2) 店名（自動縮放）+ 職人名
    sf = fit_font(d, store, "semibold", int(W * 0.105), W - 2 * m)
    center(d, store, sf, int(H * 0.150), CREAM, W)
    center(d, designer, font("medium", int(W * 0.044)), int(H * 0.232), GOLD, W)

    # 3) QR 底卡（圓角）+ QR + 中央金 M
    panel = int(W * 0.66); px = int((W - panel) / 2); py = int(H * 0.300)
    d.rounded_rectangle([px, py, px + panel, py + panel], radius=int(panel * 0.06), fill=PANEL)
    qsize = int(panel * 0.82)
    qr = make_qr(url, qsize)
    qx = px + (panel - qsize) // 2; qy = py + (panel - qsize) // 2
    img.paste(qr, (qx, qy))
    # 中央 M 徽章
    r = int(qsize * 0.115); mc = (qx + qsize // 2, qy + qsize // 2)
    d.ellipse([mc[0] - r, mc[1] - r, mc[0] + r, mc[1] + r], fill=GOLD)
    mf = font("semibold", int(r * 1.2))
    mb = d.textbbox((0, 0), "M", font=mf)
    d.text((mc[0] - (mb[2] - mb[0]) / 2, mc[1] - (mb[3] - mb[1]) / 2 - mb[1]), "M", font=mf, fill=CREAM)

    # 4) CTA
    cta_y = py + panel + int(H * 0.045)
    center(d, "掃碼・預約專屬時段", font("medium", int(W * 0.050)), cta_y, CREAM, W)
    uw = int(W * 0.07)
    d.line([(W / 2 - uw, cta_y + int(W * 0.075)), (W / 2 + uw, cta_y + int(W * 0.075))], fill=GOLD, width=2)

    # 5) 頁尾
    center(d, "Powered by MooLah", font("regular", int(W * 0.030)), int(H * 0.935), GOLD, W)

    safe = "".join(c for c in store if c.isalnum() or c in "-_") or "card"
    out = os.path.join(outdir, f"standee_{safe}_{size}.jpg")
    os.makedirs(outdir, exist_ok=True)
    img.save(out, "JPEG", quality=95, dpi=(300, 300))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--store", required=True)
    ap.add_argument("--designer", required=True)
    ap.add_argument("--short", help="shortCode，會接在 BASE_URL 後")
    ap.add_argument("--url", help="完整 QR 目標網址（優先於 --short）")
    ap.add_argument("--size", default="A6", choices=list(SIZES))
    ap.add_argument("--outdir", default=".")
    a = ap.parse_args()
    url = a.url or (BASE_URL + a.short if a.short else None)
    if not url:
        raise SystemExit("需要 --short 或 --url")
    print("OK ->", generate(a.store, a.designer, url, a.size, a.outdir), "| QR:", url)
