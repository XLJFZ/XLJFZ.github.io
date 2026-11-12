from pathlib import Path
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from PIL import Image, ImageCms
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DecodedStreamObject, NameObject, NumberObject


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = ROOT / "output" / "pdf" / "XLJFZ-Photography-Portfolio.pdf"
W, H = landscape(A4)

BG = "#181817"
FG = "#f2f0ea"
MUTED = "#aaa79e"
LINE = "#45433f"
LIGHT_BG = "#e6e0d6"
LIGHT_FG = "#25221e"
LIGHT_MUTED = "#746e64"
LIGHT_LINE = "#b9b0a4"
_P3_ICC = None


def register_fonts():
    candidates = [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
    ]
    for path in candidates:
        if path.exists():
            pdfmetrics.registerFont(TTFont("CN", str(path)))
            return
    raise RuntimeError("No Chinese font found")


def image_path(rel):
    p = PUBLIC / rel
    if not p.exists():
        raise FileNotFoundError(p)
    return p


def display_p3_icc():
    global _P3_ICC
    if _P3_ICC is None:
        for path in (PUBLIC / "portfolio-previews").rglob("*.jpg"):
            with Image.open(path) as image:
                icc = image.info.get("icc_profile")
            if not icc:
                continue
            profile = ImageCms.ImageCmsProfile(BytesIO(icc))
            if ImageCms.getProfileDescription(profile).strip() == "sP3C":
                _P3_ICC = icc
                break
    if _P3_ICC is None:
        raise RuntimeError("Display P3 ICC profile not found in portfolio assets")
    return _P3_ICC


def pdf_image_path(rel):
    source = image_path(rel)
    cache = ROOT / "tmp" / "pdfs" / "assets"
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / ("__".join(source.relative_to(PUBLIC).parts))
    with Image.open(source) as im:
        icc = im.info.get("icc_profile")
        im = im.convert("RGB")
        source_profile = (
            ImageCms.ImageCmsProfile(BytesIO(icc))
            if icc else ImageCms.createProfile("sRGB")
        )
        destination_profile = ImageCms.ImageCmsProfile(BytesIO(display_p3_icc()))
        im = ImageCms.profileToProfile(
            im, source_profile, destination_profile, outputMode="RGB"
        )
        im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        im.save(
            target, "JPEG", quality=80, optimize=True, progressive=True,
            icc_profile=display_p3_icc()
        )
    return target


def embed_display_p3_colorspace(path, bookmarks):
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    icc_stream = DecodedStreamObject()
    icc_stream.set_data(display_p3_icc())
    icc_stream[NameObject("/N")] = NumberObject(3)
    icc_stream[NameObject("/Alternate")] = NameObject("/DeviceRGB")
    icc_ref = writer._add_object(icc_stream)
    p3_colorspace = ArrayObject([NameObject("/ICCBased"), icc_ref])
    image_count = 0
    for page in writer.pages:
        resources = page["/Resources"].get_object()
        xobjects = resources.get("/XObject")
        if not xobjects:
            continue
        for reference in xobjects.get_object().values():
            image = reference.get_object()
            if image.get("/Subtype") == "/Image":
                image[NameObject("/ColorSpace")] = p3_colorspace
                image_count += 1
    writer.add_metadata({
        "/Title": "迅雷疾风 | 摄影作品集 2022-2026",
        "/Author": "迅雷疾风 / XLJFZ Photography",
        "/Subject": "建筑、城市、风光与旅行摄影作品集",
        "/Keywords": "摄影, 建筑, 城市, 风光, 旅行, XLJFZ",
        "/Creator": "XLJFZ Photography Portfolio Builder",
    })
    for title, page_number in bookmarks:
        writer.add_outline_item(title, page_number)
    temporary = path.with_suffix(".p3.pdf")
    with temporary.open("wb") as stream:
        writer.write(stream)
    temporary.replace(path)
    if image_count == 0:
        raise RuntimeError("No PDF image objects received the Display P3 colorspace")
    return image_count


def cover_draw(c, path, x, y, w, h, position=0.5, darken=0):
    source = image_path(path)
    with Image.open(source) as im:
        iw, ih = im.size
    path = pdf_image_path(path)
    scale = max(w / iw, h / ih)
    sw, sh = iw * scale, ih * scale
    sx = x + (w - sw) * 0.5
    sy = y + (h - sh) * position
    c.saveState()
    p = c.beginPath()
    p.rect(x, y, w, h)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(str(path), sx, sy, sw, sh, preserveAspectRatio=True, mask="auto")
    if darken:
        c.setFillColorRGB(0, 0, 0, alpha=darken)
        c.rect(x, y, w, h, fill=1, stroke=0)
    c.restoreState()


def fit_draw(c, path, x, y, w, h):
    source = image_path(path)
    with Image.open(source) as im:
        iw, ih = im.size
    path = pdf_image_path(path)
    scale = min(w / iw, h / ih)
    sw, sh = iw * scale, ih * scale
    c.drawImage(str(path), x + (w - sw) / 2, y + (h - sh) / 2, sw, sh,
                preserveAspectRatio=True, mask="auto")


def text(c, value, x, y, size, color=FG, leading=None):
    c.setFillColor(color)
    c.setFont("CN", size)
    t = c.beginText(x, y)
    t.setLeading(leading or size * 1.45)
    for line in value.split("\n"):
        t.textLine(line)
    c.drawText(t)


def page_palette(chapter=None):
    if chapter:
        return LIGHT_BG, LIGHT_FG, LIGHT_MUTED, LIGHT_LINE
    return BG, FG, MUTED, LINE


def chapter_header(c, chapter, foreground, muted, line):
    number, title, english = chapter
    text(c, f"{number:02d}  /  04", 22, H - 29, 6.2, muted)
    text(c, title, 80, H - 29, 15, foreground)
    text(c, english.upper(), 160, H - 29, 6.2, muted)
    c.setStrokeColor(line)
    c.setLineWidth(0.35)
    c.line(22, H - 43, W - 22, H - 43)


def footer(c, page, label="XLJFZ PHOTOGRAPHY", muted=MUTED, line=LINE):
    c.setStrokeColor(line)
    c.setLineWidth(0.35)
    c.line(22, 12, W - 22, 12)
    text(c, label, 22, 5.8, 5.8, muted)
    text(c, f"{page:02d}", W - 29, 5.8, 5.8, muted)


def base(c, background=BG):
    c.setFillColor(background)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def series_intro(c, n, title, english, statement, meta, photo, caption, page):
    base(c)
    fit_draw(c, photo, W * 0.42 + 8, 18, W * 0.58 - 24, H - 36)
    text(c, f"{n:02d} / 04", 18, H - 24, 6.5, MUTED)
    text(c, title, 18, H - 51, 26)
    text(c, english.upper(), 18, H - 63, 7, MUTED)
    c.setStrokeColor(LINE)
    c.line(18, H - 73, W * 0.35, H - 73)
    text(c, statement, 18, H - 89, 8.2, FG, 13)
    text(c, meta, 18, 33, 6.3, MUTED, 9)
    text(c, caption, W * 0.44, 14, 5.8, FG)
    footer(c, page)


def two_up(c, left, right, left_caption, right_caption, page, chapter=None):
    background, foreground, muted, line = page_palette(chapter)
    base(c, background)
    if chapter:
        chapter_header(c, chapter, foreground, muted, line)
    margin, gap, top, bottom = 22, 14, 57 if chapter else 22, 28
    cell = (W - margin * 2 - gap) / 2
    fit_draw(c, left, margin, bottom, cell, H - top - bottom)
    fit_draw(c, right, margin + cell + gap, bottom, cell, H - top - bottom)
    text(c, left_caption, margin, 17, 6.3, muted)
    text(c, right_caption, margin + cell + gap, 17, 6.3, muted)
    footer(c, page, muted=muted, line=line)


def wide_page(c, photo, caption, page, crop=False, position=0.5, chapter=None):
    background, foreground, muted, line = page_palette(chapter)
    base(c, background)
    if chapter:
        chapter_header(c, chapter, foreground, muted, line)
    top = 57 if chapter else 22
    portrait = is_portrait(photo)
    if portrait:
        photo_w = W * 0.5
        photo_x = 22 if page % 2 else W - 22 - photo_w
        fit_draw(c, photo, photo_x, 27, photo_w, H - top - 27)
        copy_x = W * 0.61 if page % 2 else 22
        text(c, "PHOTOGRAPH", copy_x, H - 58, 6.1, muted)
        text(c, caption, copy_x, H - 75, 10, foreground)
        c.setStrokeColor(line)
        c.setLineWidth(0.35)
        c.line(copy_x, H - 82, copy_x + 74, H - 82)
        text(c, "XLJFZ\nARCHITECTURE  /  LANDSCAPE  /  TRAVEL", copy_x, H - 95, 5.8, muted, 9.5)
    elif crop:
        cover_draw(c, photo, 22, 27, W - 44, H - top - 27, position)
    else:
        fit_draw(c, photo, 22, 27, W - 44, H - top - 27)
        text(c, caption, 22, 17, 6.3, muted)
    footer(c, page, muted=muted, line=line)


def portfolio_images():
    source = (ROOT / "src" / "lib" / "portfolio.ts").read_text(encoding="utf-8")
    pattern = re.compile(
        r"src:\s*'(?P<src>/portfolio-previews/(?P<slug>[^/]+)/[^']+\.jpg)'"
        r"(?P<body>.*?caption:\s*'(?P<caption>[^']+)')",
        re.S,
    )
    grouped = {key: [] for key in [
        "urban-pulse", "distant-weather", "textures-of-time", "nearby-moments"
    ]}
    for match in pattern.finditer(source):
        slug = match.group("slug")
        if slug in grouped:
            grouped[slug].append((match.group("src").lstrip("/"), match.group("caption")))
    grouped["urban-pulse"] = [
        item for item in grouped["urban-pulse"]
        if not item[0].endswith((
            "beijing-zbz-9649-1800.jpg",
            "shanghai-zbz-8705-1800.jpg",
        ))
    ]
    grouped["distant-weather"] = [
        item for item in grouped["distant-weather"]
        if not item[0].endswith("pingtan-zbz-2955-1800.jpg")
    ]
    grouped["distant-weather"].insert(
        2,
        ("hero-previews/hero-zbz-2714-2200.jpg", "德钦 · 雪达湖 · 2025"),
    )
    expected = {"urban-pulse": 44, "distant-weather": 8, "textures-of-time": 8, "nearby-moments": 3}
    actual = {key: len(value) for key, value in grouped.items()}
    if actual != expected:
        raise RuntimeError(f"Portfolio image parse mismatch: {actual}")
    return grouped


def is_portrait(path):
    with Image.open(image_path(path)) as im:
        return im.height / im.width >= 1.18


def add_complete_series(c, images, start_page, chapter):
    page = start_page
    index = 0
    while index < len(images):
        current = images[index]
        next_is_wukang_pair = (
            index + 1 < len(images)
            and current[0].endswith("shanghai-img-150846-1800.jpg")
            and images[index + 1][0].endswith("shanghai-img-150903-1800.jpg")
        )
        if index + 1 < len(images) and (
            (is_portrait(current[0]) and is_portrait(images[index + 1][0]))
            or next_is_wukang_pair
        ):
            next_item = images[index + 1]
            two_up(
                c, current[0], next_item[0], current[1], next_item[1], page,
                chapter=chapter if index == 0 else None,
            )
            index += 2
        else:
            wide_page(
                c, current[0], current[1], page,
                chapter=chapter if index == 0 else None,
            )
            index += 1
        c.showPage()
        page += 1
    return page


def build():
    register_fonts()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("迅雷疾风 | 摄影作品集")
    c.setAuthor("迅雷疾风 / XLJFZ Photography")

    grouped = portfolio_images()
    # 01 Cover - the photograph is shown in full, without cropping.
    base(c)
    fit_draw(c, "hero-previews/hero-zbz-2714-2200.jpg", 0, 25, W, H - 25)
    c.setFillColor(BG)
    c.rect(0, 0, W, 29, fill=1, stroke=0)
    text(c, "迅雷疾风", 18, 13, 15)
    text(c, "XLJFZ PHOTOGRAPHY PORTFOLIO  /  2022-2026", 94, 13, 6.5, MUTED)
    text(c, "德钦  ·  雪达湖  ·  2025", W - 77, 13, 5.8, FG)
    c.showPage()

    # 02 About
    base(c)
    photo_x = W * 0.55
    fit_draw(c, "portfolio-previews/urban-pulse/chongqing-zbz-9356-1800.jpg", photo_x, 24, W - photo_x - 22, H - 48)
    x = 22
    text(c, "02  /  ABOUT", x, H - 31, 5.8, MUTED)
    text(c, "迅雷疾风", x, H - 62, 26)
    text(c, "XLJFZ PHOTOGRAPHY", x, H - 74, 6.3, MUTED)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.45)
    c.line(x, H - 86, W * 0.46, H - 86)
    text(c, "镜头不是答案，\n而是持续观看世界的方式。", x, H - 108, 13, FG, 19)
    text(c, "作品常从日常行走开始：城市中被忽略的转角，\n光落在材料上的几秒钟，以及天气将熟悉景观\n变得陌生的时刻。", x, H - 158, 8.2, MUTED, 13)
    c.line(x, 58, W * 0.46, 58)
    text(c, "工作与生活", x, 46, 6, MUTED)
    text(c, "上海  ·  西安", x, 34, 7.5, FG)
    text(c, "拍摄方向", x + 86, 46, 6, MUTED)
    text(c, "建筑  ·  风光  ·  旅行", x + 86, 34, 7.5, FG)
    footer(c, 2)
    c.showPage()

    page = 3
    bookmarks = [("封面", 0), ("关于", 1)]
    sections = [
        ("urban-pulse", "城市脉冲", "Urban Pulse"),
        ("distant-weather", "远方的天气", "Distant Weather"),
        ("textures-of-time", "时间的纹理", "Textures of Time"),
        ("nearby-moments", "近处发生", "Nearby Moments"),
    ]
    for index, (slug, title, english) in enumerate(sections):
        bookmarks.append((title, page - 1))
        images = grouped[slug]
        if slug == "urban-pulse":
            xiamen_start = next(i for i, item in enumerate(images) if "/xiamen-" in item[0])
            page = add_complete_series(c, images[:xiamen_start], page, (index + 1, title, english))
            bookmarks.append(("厦门", page - 1))
            xiamen = images[xiamen_start:]
            # Match the web gallery: pair the railway portrait with the coastal
            # portrait before the full-width panorama, then close with two portraits.
            coast = next(i for i, item in enumerate(xiamen) if "xiamen-zbz-1197-" in item[0])
            panorama = next(i for i, item in enumerate(xiamen) if "xiamen-zbz-1188-" in item[0])
            xiamen.insert(panorama, xiamen.pop(coast))
            page = add_complete_series(c, xiamen, page, None)
        else:
            page = add_complete_series(c, images, page, (index + 1, title, english))

    c.save()
    image_count = embed_display_p3_colorspace(OUT, bookmarks)
    print(f"Display P3 image objects: {image_count}")
    print(OUT)


if __name__ == "__main__":
    build()
