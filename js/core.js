'use strict';

/* Общие помощники: поиск элементов, хранилище, язык, звук, окна и печати.
   Подключается после data.js и до файлов разделов. */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* localStorage бывает недоступен (приватный режим), поэтому всё через try */
const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem('sv-' + key);
      return value == null ? fallback : JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('sv-' + key, JSON.stringify(value));
    } catch (e) {
      /* без сохранения сайт тоже работает */
    }
  }
};

/* Язык и перевод */
let lang = store.get('lang', 'ru') === 'be' ? 'be' : 'ru';
/* берёт текст на текущем языке из пары T(ru, be) */
const tr = (text) => (text && typeof text === 'object' && 'ru' in text ? text[lang] : text);
/* наборы текстов на текущем языке */
const ui = () => UI[lang];
const texts = () => P[lang];
const gameTexts = () => GTXT[lang];

/* Экранирование текста перед вставкой в HTML */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ESC[c]);

/* уменьшенная копия картинки для списков и карточек (папка img/thumbs) */
const thumb = (src) => src.replace('img/', 'img/thumbs/');

/* создаёт элемент с классом и текстом */
function createEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* Прогресс посетителя: что уже открыто и какие печати собраны */
const progress = {
  stamps: store.get('stamps', {}),
  events: store.get('events', []),
  places: store.get('places', []),
  shrines: store.get('shrines', []),
  found: store.get('found', []),
  endings: store.get('endings', []),
  candles: Number(store.get('candles', 0)) || 0
};
['events', 'places', 'shrines', 'found', 'endings'].forEach((key) => {
  if (!Array.isArray(progress[key])) progress[key] = [];
});
if (!progress.stamps || typeof progress.stamps !== 'object') progress.stamps = {};

/* Добавляет значение в список прогресса; true — если оно новое */
function remember(listName, value) {
  const list = progress[listName];
  if (list.includes(value)) return false;
  list.push(value);
  store.set(listName, list);
  return true;
}

/* Звуки синтезируются через Web Audio — без аудиофайлов.
   Браузер разрешает звук только после первого касания, поэтому запуск по pointerdown. */
const sound = { ctx: null, out: null, noise: null };

/* создаёт аудиоконтекст и шум для шороха */
function initSound() {
  if (sound.ctx) {
    if (sound.ctx.state === 'suspended') sound.ctx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  sound.ctx = new AudioCtx();
  sound.out = sound.ctx.createGain();
  sound.out.gain.value = 0.7;
  sound.out.connect(sound.ctx.destination);
  /* секунда белого шума для звука перелистывания */
  const buffer = sound.ctx.createBuffer(1, sound.ctx.sampleRate, sound.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  sound.noise = buffer;
}
document.addEventListener('pointerdown', initSound, { once: true });

/* Плавная огибающая громкости: нарастание за attack, затухание за decay */
function envelope(gain, time, peak, attack, decay) {
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
}

/* Шорох бумаги при смене кадра или открытки */
function playSwish() {
  if (!sound.ctx) return;
  const t = sound.ctx.currentTime;
  const source = sound.ctx.createBufferSource();
  const filter = sound.ctx.createBiquadFilter();
  const gain = sound.ctx.createGain();
  source.buffer = sound.noise;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700, t);
  filter.frequency.exponentialRampToValueAtTime(2400, t + 0.22);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(sound.out);
  envelope(gain, t, 0.08, 0.02, 0.22);
  source.start(t);
  source.stop(t + 0.3);
}

/* Тихий колокольчик: основной тон и два обертона */
function playBell(freq = 523.25, volume = 0.05) {
  if (!sound.ctx) return;
  const t = sound.ctx.currentTime;
  [
    [1, 1],
    [2.01, 0.4],
    [2.76, 0.25]
  ].forEach(([ratio, level], i) => {
    const osc = sound.ctx.createOscillator();
    const gain = sound.ctx.createGain();
    osc.frequency.value = freq * ratio;
    osc.connect(gain);
    gain.connect(sound.out);
    envelope(gain, t, volume * level, 0.004, 1.6 / (1 + i));
    osc.start(t);
    osc.stop(t + 1.8);
  });
}

/* Уведомление внизу экрана */
let toastTimer = 0;

/* показывает уведомление на 2,8 секунды */
function showToast(message) {
  const toast = $('#toast');
  /* поверх открытого <dialog> обычные элементы не видны — переносим уведомление внутрь окна */
  const host = $('dialog[open]') || document.body;
  if (toast.parentNode !== host) host.append(toast);
  $('#toast-t').textContent = message;
  toast.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 2800);
}

/* Печати «Путевого листа»: по одной за каждый пройденный раздел */
const STAMP_KEYS = ['chronicle', 'map', 'shrines', 'comic', 'game', 'quiz'];
const countStamps = () => STAMP_KEYS.filter((key) => progress.stamps[key]).length;

/* счётчик печатей в шапке */
function paintPassport() {
  $('#pass-n').textContent = `${countStamps()}/6`;
}

/* ставит печать раздела (один раз) */
function addStamp(key) {
  if (progress.stamps[key]) return;
  progress.stamps[key] = 1;
  store.set('stamps', progress.stamps);
  paintPassport();
  /* станция на маршруте в шапке сразу становится золотой */
  $$(`.route__link[href="#${key}"]`).forEach((link) => link.parentNode.classList.add('route__stop--stamped'));
  showToast(ui().toast(countStamps()));
  playBell(659.25, 0.05);
}

/* Окна на нативном <dialog>: фокус внутри окна и закрытие по Esc браузер даёт сам */
const modal = $('#modal');
const modalBody = $('#modal-body');
/* элемент, на который вернуть фокус после закрытия окна */
let lastFocus = null;

/* открывает окно и запоминает, откуда пришёл фокус */
function showDialog(dialog) {
  if (dialog.open) return;
  lastFocus = document.activeElement;
  dialog.showModal();
}

/* возвращает фокус после закрытия окна */
function restoreFocus() {
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

/* открывает окно с готовой разметкой; single — в одну колонку */
function openModal(html, single = false) {
  modal.classList.toggle('modal--single', single);
  modalBody.innerHTML = html;
  showDialog(modal);
  modalBody.scrollTop = 0;
  $('.modal__close', modal).focus();
}

/* закрывает окно */
function closeModal() {
  modal.close();
}

modal.addEventListener('close', restoreFocus);
$('.modal__close', modal).addEventListener('click', closeModal);
/* клик по затемнению вокруг окна тоже закрывает его */
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

/* Карточка документа из архива */
function openDoc(id) {
  const doc = DOCS[id];
  openModal(`
    <img class="modal__img" src="${doc.img}" alt="${esc(tr(doc.t))}">
    <div>
      <p class="eyebrow">${esc(tr(doc.cap))}</p>
      <h3 class="modal__title" id="m-title">${esc(tr(doc.t))}</h3>
      <p>${esc(tr(doc.x))}</p>
      <p class="modal__source">${esc(ui().source)}: ${esc(tr(doc.src))}</p>
    </div>
  `);
}

/* Переход в раздел с прокруткой к блоку: блок запоминается, раздел открывается сверху,
   а прокрутка — в следующем кадре, после отрисовки */
let routeFocus = '';
function goTo(name, block = '') {
  const hash = block ? `#${name}/${block}` : `#${name}`;
  if (location.hash === hash) showRoute();
  else location.hash = hash;
}
function focusBlock() {
  if (!routeFocus) return;
  const target = $('#' + routeFocus);
  routeFocus = '';
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

/* порядок разделов 1–7: по нему строятся «станции» в шапке и кнопки «Назад / Дальше» */
const SECTION_ORDER = ['chronicle', 'map', 'fates', 'shrines', 'comic', 'game', 'archive', 'quiz'];

/* Маршрут из 7 станций: где посетитель сейчас и где уже получена печать */
function routeHtml(current) {
  const stops = SECTION_ORDER.map((name, i) => {
    const isCurrent = name === current;
    let mods = '';
    if (isCurrent) mods += ' route__stop--current';
    if (progress.stamps[name]) mods += ' route__stop--stamped';
    return `
      <li class="route__stop${mods}">
        <a class="route__link" href="#${name}" ${isCurrent ? 'aria-current="step"' : ''}>
          <span class="route__num">${i + 1}</span>
          <span class="route__name">${esc(ui().nav[name])}</span>
          ${progress.stamps[name] ? `<span class="visually-hidden">${esc(ui().stampDone)}</span>` : ''}
        </a>
      </li>`;
  }).join('');
  return `<nav class="route" aria-label="${esc(ui().routeLabel)}"><ol class="route__list">${stops}</ol></nav>`;
}

/* Шапка раздела: маршрут, заголовок, орнамент, вводный текст и кнопки (если нужны) */
function pageHead(id, title, lead = '', extra = '') {
  return `
    <div class="page-band">
      <div class="container">
        <header class="page-head">
          ${SECTION_ORDER.includes(id) ? routeHtml(id) : ''}
          <h2 class="page-head__title" id="t-${id}">${esc(title)}</h2>
          <span class="ornament ornament--dark" aria-hidden="true"></span>
          ${lead ? `<p class="lead page-head__lead">${esc(lead)}</p>` : ''}
          ${extra}
        </header>
      </div>
    </div>
  `;
}

/* Кнопки-фильтры: подсвечивают выбранную и сообщают о выборе */
function renderFilters(box, items, current, onPick) {
  items.forEach(([key, label]) => {
    const button = createEl('button', 'filters__btn', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(key === current));
    button.addEventListener('click', () => {
      $$('.filters__btn', box).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      onPick(key);
    });
    box.append(button);
  });
}

/* Варианты ответа А/Б/В (вопрос дня и викторина) */
function optionsHtml(options) {
  return options
    .map(
      (text, k) => `
        <button class="option" type="button" data-k="${k}">
          <span class="option__key">${'АБВ'[k]}</span>
          <span>${esc(text)}</span>
        </button>`
    )
    .join('');
}

/* Показывает правильный ответ и зачёркивает неверный */
function markAnswer(box, picked, right) {
  $$('.option', box).forEach((option, k) => {
    option.disabled = true;
    if (k === right) option.classList.add('option--right');
    else if (k === picked) option.classList.add('option--wrong');
  });
}
