"""Аудиорассказы: нейросетевой мужской голос (Microsoft Edge TTS, ru-RU-DmitryNeural), медленно и ниже,
затем обработка «под старую запись» — голос ещё ниже и старше, полоса граммофона, лёгкий треск.

Запуск: python make_audio.py <папка сайта/audio> [имя_дорожки ...]
Пишет MP3 (моно, 24 кГц, 40 кбит/с) и durations.json (секунды) рядом.
"""
import asyncio
import io
import json
import sys
from pathlib import Path

import edge_tts
import lameenc
import miniaudio
import numpy as np
from scipy.signal import butter, resample_poly, sosfilt

sys.path.insert(0, str(Path(__file__).parent))
from audio_texts import TRACKS  # noqa: E402

OUT = Path(sys.argv[1])
ONLY = set(sys.argv[2:])
RATE = 24000
VOICE = 'ru-RU-DmitryNeural'
ACCENT = chr(0x301)
OUT.mkdir(parents=True, exist_ok=True)


def accents(text):
    """«+» перед гласной → знак ударения после неё"""
    out, i = [], 0
    while i < len(text):
        if text[i] == '+' and i + 1 < len(text):
            out.append(text[i + 1] + ACCENT)
            i += 2
        else:
            out.append(text[i])
            i += 1
    return ''.join(out)


async def phrase(text):
    """одна фраза голосом: медленнее и ниже обычного (сервис иногда молчит — до 6 попыток)"""
    for attempt in range(6):
        try:
            tts = edge_tts.Communicate(accents(text), VOICE, rate='-14%', pitch='-12Hz')
            buf = io.BytesIO()
            async for chunk in tts.stream():
                if chunk['type'] == 'audio':
                    buf.write(chunk['data'])
            if buf.tell():
                break
        except Exception as err:  # сервис молчит или сеть оборвалась — пробуем ещё раз
            print('  повтор:', type(err).__name__, flush=True)
        await asyncio.sleep(2 + 3 * attempt)
    else:
        raise RuntimeError('нет звука: ' + text[:40])
    pcm = miniaudio.decode(buf.getvalue(), output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=RATE)
    return np.frombuffer(pcm.samples, dtype=np.float32).copy()


def old_record(x, seed):
    """«старая запись»: на 5 % медленнее (голос ниже и старше), полоса 160–4200 Гц, мягкое насыщение, треск и шорох"""
    x = resample_poly(x, 100, 95)
    x = sosfilt(butter(4, [160, 4200], btype='band', fs=RATE, output='sos'), x)
    x = np.tanh(1.8 * x) / np.tanh(1.8)
    rng = np.random.default_rng(seed)
    hiss = sosfilt(butter(2, [1500, 6000], btype='band', fs=RATE, output='sos'), rng.normal(0, 1, len(x)))
    x = x + 0.004 * hiss / (np.abs(hiss).max() + 1e-9)
    clicks = np.zeros(len(x))
    pos = rng.integers(0, len(x), size=max(1, len(x) // (RATE // 2)))
    clicks[pos] = rng.uniform(-1, 1, len(pos)) * 0.05
    x = x + sosfilt(butter(2, 3000, btype='low', fs=RATE, output='sos'), clicks)
    return x / (np.abs(x).max() + 1e-9) * 0.9


def mp3(samples):
    enc = lameenc.Encoder()
    enc.set_bit_rate(40)
    enc.set_in_sample_rate(RATE)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes()
    return enc.encode(pcm) + enc.flush()


async def main():
    dur_file = OUT / 'durations.json'
    durations = json.loads(dur_file.read_text(encoding='utf-8')) if dur_file.exists() else {}
    for k, (name, phrases) in enumerate(TRACKS.items()):
        if ONLY and name not in ONLY:
            continue
        done = OUT / f'{name}.mp3'
        if not ONLY and done.exists():
            # уже озвучено: только длительность (по декодированному файлу)
            if name not in durations:
                info = miniaudio.mp3_get_file_info(str(done))
                durations[name] = round(info.duration)
            continue
        parts = [np.zeros(int(RATE * 0.5), dtype=np.float32)]
        for i, text in enumerate(phrases):
            parts.append(await phrase(text))
            parts.append(np.zeros(int(RATE * (0.85 if i == 0 else 0.5)), dtype=np.float32))
        sound = old_record(np.concatenate(parts), seed=k + 7)
        data = mp3(sound)
        (OUT / f'{name}.mp3').write_bytes(data)
        durations[name] = round(len(sound) / RATE)
        print(f'{name}: {durations[name]} s, {len(data) // 1024} KB', flush=True)
        # после каждой дорожки: прерванный запуск не теряет готовое
        dur_file.write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding='utf-8')
    dur_file.write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding='utf-8')


asyncio.run(main())
