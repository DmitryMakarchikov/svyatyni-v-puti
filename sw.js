'use strict';

/* Сервис-воркер: после первого открытия сайт работает и без интернета.
   Стратегия «сначала сеть»: при интернете всегда загружается свежая версия,
   без сети — сохранённая копия. Картинки попадают в кэш по мере просмотра. */

const CACHE = 'svyatyni-v-puti-v17';

/* всё, что нужно, чтобы главная открылась офлайн */
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/data.js',
  'js/core.js',
  'js/pages/home.js',
  'js/pages/chronicle.js',
  'js/pages/map.js',
  'js/pages/fates.js',
  'js/pages/shrines.js',
  'js/pages/comic.js',
  'js/pages/game.js',
  'js/pages/archive.js',
  'js/pages/letter.js',
  'js/pages/family.js',
  'js/pages/quiz.js',
  'js/main.js',
  'fonts/fira-xcond-600-cyrillic.woff2',
  'fonts/fira-xcond-600-latin.woff2',
  'fonts/old-standard-400-cyrillic.woff2',
  'fonts/old-standard-400-latin.woff2',
  'fonts/old-standard-400-italic-cyrillic.woff2',
  'fonts/old-standard-400-italic-latin.woff2',
  'fonts/literata-400-700-cyrillic.woff2',
  'fonts/literata-400-700-latin.woff2',
  'img/favicon.svg',
  'img/icon-augustow.jpg'
];

/* при установке сохраняем основу сайта */
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

/* при обновлении удаляем старые версии кэша */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

/* Аудиорассказ: целиком один раз — в кэш, дальше играет и без интернета.
   Плеер просит запись кусками (заголовок Range) — отдаём нужный кусок из сохранённой копии */
async function audioResponse(request) {
  const cache = await caches.open(CACHE);
  let full = await cache.match(request.url);
  if (!full) {
    full = await fetch(request.url);
    if (full.status === 200) await cache.put(request.url, full.clone());
  }
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!range || full.status !== 200) return full;
  const body = await full.arrayBuffer();
  const start = range[1] ? Number(range[1]) : 0;
  const end = range[2] ? Math.min(Number(range[2]), body.byteLength - 1) : body.byteLength - 1;
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${body.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

/* сначала сеть, при ошибке — копия из кэша */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (new URL(request.url).pathname.endsWith('.mp3')) {
    event.respondWith(audioResponse(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
