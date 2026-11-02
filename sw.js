'use strict';

/* Сервис-воркер: после первого открытия сайт работает и без интернета.
   Стратегия «сначала сеть»: при интернете всегда загружается свежая версия,
   без сети — сохранённая копия. Картинки попадают в кэш по мере просмотра. */

const CACHE = 'svyatyni-v-puti-v1';

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
  'js/pages/shrines.js',
  'js/pages/comic.js',
  'js/pages/game.js',
  'js/pages/archive.js',
  'js/pages/quiz.js',
  'js/pages/about.js',
  'js/main.js',
  'fonts/forum-400-cyrillic.woff2',
  'fonts/forum-400-latin.woff2',
  'fonts/literata-400-700-cyrillic.woff2',
  'fonts/literata-400-700-latin.woff2',
  'fonts/plex-mono-400-cyrillic.woff2',
  'fonts/plex-mono-400-latin.woff2',
  'fonts/plex-mono-600-cyrillic.woff2',
  'fonts/plex-mono-600-latin.woff2',
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

/* сначала сеть, при ошибке — копия из кэша */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
