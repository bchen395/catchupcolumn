"""Generate newspaper-themed icon assets for Catch Up Column.

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

# Brand palette (must match constants/colors.ts / design/BRAND.md)
PAPER_WARM = (250, 247, 242, 255)  # paperWarm #FAF7F2 — app background
INK = (0, 0, 0, 255)               # ink #000000 — masthead rules
ORANGE = (255, 114, 55, 255)       # orange #FF7237 — the focal C
WHITE = (255, 255, 255, 255)


def find_serif_font(size: int):
    """Try to find a heavy slab-ish serif font on macOS, fall back to default."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Rockwell.ttc",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
        "/Library/Fonts/Georgia.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_newspaper_motif(
    draw: ImageDraw.ImageDraw, size: int, c_fill=ORANGE, rule_fill=INK
):
    """Draw a stylized 'C' (Catch Up Column) between masthead rules."""
    rule_y_top = int(size * 0.16)
    rule_y_bot = int(size * 0.84)
    rule_inset = int(size * 0.16)
    rule_thick = max(2, size // 56)
    draw.rectangle(
        (rule_inset, rule_y_top, size - rule_inset, rule_y_top + rule_thick),
        fill=rule_fill,
    )
    draw.rectangle(
        (rule_inset, rule_y_bot - rule_thick, size - rule_inset, rule_y_bot),
        fill=rule_fill,
    )

    # Big serif C — the focal mark
    c_font = find_serif_font(int(size * 0.66))
    c_text = "C"
    bbox = draw.textbbox((0, 0), c_text, font=c_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx = (size - tw) / 2 - bbox[0]
    cy = (size - th) / 2 - bbox[1]
    draw.text((cx, cy), c_text, font=c_font, fill=c_fill)


def make_icon(size: int, bg, transparent_bg: bool = False) -> Image.Image:
    if transparent_bg:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)
    draw_newspaper_motif(draw, size)
    return img


def make_splash(size: int) -> Image.Image:
    """The splash motif on a transparent field — Expo composites it on the
    splash `backgroundColor`, so a transparent icon leaves no visible square
    seam against that background."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    motif_size = int(size * 0.55)
    motif = make_icon(motif_size, PAPER_WARM, transparent_bg=True)
    img.paste(motif, ((size - motif_size) // 2, (size - motif_size) // 2), motif)
    return img


def main():
    # Main icon: 1024×1024, flattened to RGB — Apple rejects alpha in the
    # App Store marketing icon.
    icon = make_icon(1024, PAPER_WARM).convert("RGB")
    icon.save(os.path.join(OUT_DIR, "icon.png"))

    # Adaptive icon (Android): foreground only on transparent — Android
    # composites it on top of the configured background color. Content is
    # kept inside the central 66% safe area so circular masks don't clip it.
    adaptive_size = 1024
    adaptive = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
    inner_size = int(adaptive_size * 0.66)
    inner = make_icon(inner_size, PAPER_WARM, transparent_bg=True)
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
    favicon = make_icon(48, PAPER_WARM)
    favicon.save(os.path.join(OUT_DIR, "favicon.png"))

    # Android status-bar notification icon: must be a white-on-transparent
    # silhouette or Android renders it as a solid square.
    notif_size = 96
    notif = Image.new("RGBA", (notif_size, notif_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(notif)
    draw_newspaper_motif(draw, notif_size, c_fill=WHITE, rule_fill=WHITE)
    notif.save(os.path.join(OUT_DIR, "notification-icon.png"))

    print("Wrote:", sorted(os.listdir(OUT_DIR)))


if __name__ == "__main__":
    main()
