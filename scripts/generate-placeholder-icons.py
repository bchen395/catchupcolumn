"""Generate placeholder newspaper-themed icon assets for Catch Up Column.

Run this script once to (re)generate icons; output goes into assets/images/.
The brand identity is intentionally simple so you can swap with final art
later: just replace the PNGs at the same paths.
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "assets",
    "images",
)
os.makedirs(OUT_DIR, exist_ok=True)

# Brand palette (must match constants/colors.ts)
CREAM = (255, 253, 247, 255)       # background
WARM = (250, 246, 239, 255)        # backgroundWarm
INK = (44, 44, 44, 255)            # text
ACCENT = (122, 46, 59, 255)        # accent (burgundy)
NAVY = (27, 58, 75, 255)           # accentNavy
BORDER = (232, 226, 217, 255)      # border


def find_serif_font(size: int) -> ImageFont.ImageFont:
    """Try to find a serif font on macOS, fall back to default."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
        "/Library/Fonts/Georgia.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_newspaper_motif(img: Image.Image, draw: ImageDraw.ImageDraw, size: int):
    """Draw a stylized 'C' (Catch Up Column) over a newspaper masthead."""
    # Decorative top/bottom rules
    rule_y_top = int(size * 0.18)
    rule_y_bot = int(size * 0.82)
    rule_inset = int(size * 0.18)
    rule_thick = max(2, size // 80)
    draw.rectangle(
        (rule_inset, rule_y_top, size - rule_inset, rule_y_top + rule_thick),
        fill=INK,
    )
    draw.rectangle(
        (rule_inset, rule_y_bot - rule_thick, size - rule_inset, rule_y_bot),
        fill=INK,
    )

    # Big serif C — the focal mark
    c_font = find_serif_font(int(size * 0.62))
    c_text = "C"
    # measure
    bbox = draw.textbbox((0, 0), c_text, font=c_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx = (size - tw) / 2 - bbox[0]
    cy = (size - th) / 2 - bbox[1]
    draw.text((cx, cy), c_text, font=c_font, fill=ACCENT)

    # Tiny "CATCH UP COLUMN" wordmark under the C, between the rules
    sm_font = find_serif_font(max(8, size // 28))
    wm_text = "CATCH UP COLUMN"
    bbox = draw.textbbox((0, 0), wm_text, font=sm_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    wx = (size - tw) / 2 - bbox[0]
    wy = rule_y_bot + max(4, size // 64)
    if wy + th < size:
        draw.text((wx, wy), wm_text, font=sm_font, fill=NAVY)


def make_icon(size: int, bg, transparent_bg: bool = False) -> Image.Image:
    if transparent_bg:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)
    draw_newspaper_motif(img, draw, size)
    return img


def make_splash(size: int) -> Image.Image:
    """A larger composition for the splash screen."""
    img = Image.new("RGBA", (size, size), CREAM)
    draw = ImageDraw.Draw(img)
    # The motif sized at ~60% of canvas, centered
    motif_size = int(size * 0.55)
    motif = make_icon(motif_size, CREAM, transparent_bg=True)
    img.paste(motif, ((size - motif_size) // 2, (size - motif_size) // 2), motif)
    return img


def main():
    # Main icon: 1024×1024 with cream background
    icon = make_icon(1024, CREAM)
    icon.save(os.path.join(OUT_DIR, "icon.png"))

    # Adaptive icon (Android): foreground only on transparent — Android
    # composites it on top of the configured background color.
    adaptive_size = 1024
    adaptive = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
    inner_size = int(adaptive_size * 0.66)  # safe area
    inner = make_icon(inner_size, CREAM, transparent_bg=True)
    adaptive.paste(
        inner,
        ((adaptive_size - inner_size) // 2, (adaptive_size - inner_size) // 2),
        inner,
    )
    adaptive.save(os.path.join(OUT_DIR, "adaptive-icon.png"))

    # Splash screen icon (1242 wide is a common Expo splash size)
    splash = make_splash(1242)
    splash.save(os.path.join(OUT_DIR, "splash-icon.png"))

    # Web favicon
    favicon = make_icon(48, CREAM)
    favicon.save(os.path.join(OUT_DIR, "favicon.png"))

    print("Wrote:", os.listdir(OUT_DIR))


if __name__ == "__main__":
    main()
