"""Уменьшенные копии картинок для списков и карточек (папка img/thumbs).

В архиве, хронике и на главной картинки показываются маленькими,
поэтому грузить оригиналы по 300–600 КБ незачем: на слабом телефоне
это тормозит. Скрипт делает копии шириной 560 px (хватает и для экранов
с высокой плотностью пикселей) и сжимает их в прогрессивный JPEG.

Запуск: python tools/make_thumbs.py  (нужна библиотека Pillow: pip install pillow)
"""

import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')  # кириллица в консоли Windows

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'img'
DST = SRC / 'thumbs'
WIDTH = 560

DST.mkdir(exist_ok=True)
before = after = 0
for path in sorted(SRC.glob('*.jpg')):
    image = Image.open(path).convert('RGB')
    width = min(WIDTH, image.width)
    height = round(image.height * width / image.width)
    out = DST / path.name
    image.resize((width, height), Image.LANCZOS).save(out, 'JPEG', quality=80, progressive=True, optimize=True)
    before += path.stat().st_size
    after += out.stat().st_size
    print(f'{path.name:24} {path.stat().st_size // 1024:4} КБ -> {out.stat().st_size // 1024:3} КБ')

print(f'Итого: {before // 1024} КБ -> {after // 1024} КБ')
