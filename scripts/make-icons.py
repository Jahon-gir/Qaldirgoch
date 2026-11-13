"""docs/brand/migra-logo.jpg (tasdiqlangan logo, burchaklari qora) dan ilova ikonkalarini yasaydi.
Ishga tushirish: npm run icons   (Pillow kerak)"""
from PIL import Image, ImageDraw
import sys

SRC = 'docs/brand/migra-logo.jpg'
src = Image.open(SRC).convert('RGB')

def rounded(box, size, radius_ratio=0.19):
    """Logo kvadratini qirqib, alfa kanalli yumaloq maska qo'yadi (4x supersample)."""
    im = src.crop(box).resize((size, size), Image.LANCZOS).convert('RGBA')
    big = size * 4
    m = Image.new('L', (big, big), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * radius_ratio), fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS))
    return im

TILE = (58, 58, 1196, 1196)     # qora burchaksiz kvadrat
INNER = (90, 90, 1164, 1164)    # to'liq kvadrat (iOS/maskable uchun)

rounded(TILE, 192).save('public/icon-192.png', optimize=True)
rounded(TILE, 512).save('public/icon-512.png', optimize=True)
rounded(TILE, 256).save('public/logo.webp', quality=88, method=6)

# maskable: to'liq kvadrat (matn xavfsiz zonaga sig'adi), shaffoflik yo'q
src.crop(INNER).resize((512, 512), Image.LANCZOS).save('public/icon-maskable-512.png', optimize=True)

# apple-touch-icon: to'liq kvadrat, shaffoflik yo'q (iOS o'zi yumaloqlaydi)
src.crop(INNER).resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png', optimize=True)
print('tayyor')
