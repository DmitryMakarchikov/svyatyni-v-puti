"""Уменьшенные копии картинок: превью для карточек, мини-превью для сеток и средние версии для телефонов.

В архиве, хронике и на главной картинки показываются маленькими, поэтому грузить
оригиналы по 300–600 КБ незачем: на слабом телефоне это тормозит. Скрипт делает:
- img/thumbs/ — превью шириной до 560 px (карточки, окна на телефоне);
- img/mini/ — мини-превью шириной до 360 px (сетки архива, хроники и залов);
- img/<имя>-720.jpg — средняя версия для снимков шире 900 px (шапки разделов на телефоне).
Готовые файлы не перезаписываются. Ширину каждой версии сайт берёт из IMG_W в js/data.js.

Запуск: python tools/make_thumbs.py  (нужна библиотека Pillow: pip install pillow)
"""

import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')  # кириллица в консоли Windows

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'img'
SIZES = [(SRC / 'thumbs', 560, 80), (SRC / 'mini', 360, 76)]
MID = 720


def save(image, width, out, quality):
    """уменьшает до ширины width и сохраняет прогрессивным JPEG"""
    height = round(image.height * width / image.width)
    image.resize((width, height), Image.LANCZOS).save(out, 'JPEG', quality=quality, progressive=True, optimize=True)
    print(f'{out.relative_to(ROOT)}  {out.stat().st_size // 1024} КБ')


for folder, _, _ in SIZES:
    folder.mkdir(exist_ok=True)

for path in sorted(SRC.glob('*.jpg')):
    if path.stem.endswith(('-720', '-1000')) or path.stem.startswith('gev-1915-p'):
        continue  # уже уменьшенные версии и сканы письма (их смотрят целиком, под лупой)
    image = Image.open(path).convert('RGB')
    for folder, width, quality in SIZES:
        out = folder / path.name
        if not out.exists():
            save(image, min(width, image.width), out, quality)
    mid = SRC / f'{path.stem}-{MID}.jpg'
    if image.width >= 900 and not mid.exists():
        save(image, MID, mid, 76)
