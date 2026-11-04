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

/* srcset снимка: лёгкая, средняя (если есть) и полная версии; пусто, если лёгкой нет */
function srcsetOf(img) {
  const w = IMG_W[img.slice(4, -4)];
  if (!w || w[0] >= w[w.length - 1]) return '';
  const mid = w.length > 2 ? `, ${img.replace('.jpg', '-720.jpg')} 720w` : '';
  return `${thumb(img)} ${w[0]}w${mid}, ${img} ${w[w.length - 1]}w`;
}

/* превью в сетке: мини (360 px) или обычное — браузер возьмёт по ширине карточки */
function thumbAttrs(img, sizes) {
  const w = IMG_W[img.slice(4, -4)];
  const thumbW = w ? w[0] : 560;
  if (thumbW <= 360) return `src="${thumb(img)}"`;
  const mini = img.replace('img/', 'img/mini/');
  return `src="${mini}" srcset="${mini} 360w, ${thumb(img)} ${thumbW}w" sizes="${sizes}"`;
}

/* src, srcset и sizes для <img>: браузер возьмёт версию по ширине экрана */
function imgAttrs(img, sizes) {
  const set = srcsetOf(img);
  return set ? `src="${thumb(img)}" srcset="${set}" sizes="${sizes}"` : `src="${img}"`;
}

/* создаёт элемент с классом и текстом */
function createEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* Прогресс посетителя: что уже открыто и какие печати собраны */
const progress = {
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

/* содержимое блока сменилось, а его начало ушло под шапку — возвращаем начало на экран */
function keepInView(el, anchor = el) {
  const hdr = $('.site-header').getBoundingClientRect().bottom;
  if (!el || el.getBoundingClientRect().top >= hdr) return;
  const top = anchor.getBoundingClientRect().top + scrollY - hdr - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
}

/* порядок разделов: по нему — номер раздела в шапке и кнопки «Назад / Дальше» */
const SECTION_ORDER = ['chronicle', 'map', 'fates', 'shrines', 'comic', 'game', 'archive', 'quiz'];
/* снимок в шапке раздела — во всю ширину контейнера */
/* снимок шапки под затемнением: на телефоне достаточно средней версии */
const PAGE_SIZES = '(max-width: 700px) 90vw, 100vw';

/* документ архива, к которому относится снимок (для подписи на снимке) */
const docByImg = (img) => Object.keys(DOCS).find((id) => DOCS[id].img === img);

/* Шапка зала: снимок эпохи во всю ширину, «крошки», номер раздела, заголовок, вводный текст и кнопки */
function pageHead(id, title, lead = '', extra = '') {
  const n = SECTION_ORDER.indexOf(id);
  const [img, pos] = PAGE_IMG[id] || [];
  const doc = img && docByImg(img);
  return `
    <header class="page-head">
      ${img ? `<img class="page-head__img" ${imgAttrs(img, PAGE_SIZES)} alt="" fetchpriority="high" style="object-position: ${pos}">` : ''}
      <div class="container page-head__inner">
        <nav class="crumbs" aria-label="${esc(ui().crumbs)}">
          <a class="crumbs__link" href="#home">${esc(ui().nav.home)}</a>
          <span class="crumbs__sep" aria-hidden="true">/</span>
          <span class="crumbs__here" aria-current="page">${esc(ui().nav[id] || title)}</span>
        </nav>
        <div class="page-head__body">
          ${n >= 0 ? `<p class="page-head__kicker">${esc(ui().sectionOf(n + 1, SECTION_ORDER.length))}</p>` : ''}
          <h2 class="page-head__title" id="t-${id}">${esc(title)}</h2>
          ${lead ? `<p class="page-head__lead">${esc(lead)}</p>` : ''}
          ${extra}
        </div>
      </div>
      ${doc ? `<button class="page-head__credit" type="button" data-doc="${doc}">${esc(tr(DOCS[doc].t))} · ${esc(tr(DOCS[doc].cap))}</button>` : ''}
    </header>
  `;
}

/* Плавное появление блоков при прокрутке: только transform и opacity, без анимаций — если они отключены */
const revealer =
  'IntersectionObserver' in window && !reducedMotion
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            revealer.unobserve(entry.target);
          }),
        { rootMargin: '0px 0px -8% 0px' }
      )
    : null;
function reveal(root) {
  $$('[data-reveal]', root).forEach((node) =>
    revealer ? revealer.observe(node) : node.classList.add('is-in')
  );
}

/* подпись на снимке в шапке открывает карточку документа (один обработчик на весь сайт) */
document.addEventListener('click', (e) => {
  const credit = e.target.closest('.page-head__credit');
  if (credit) openDoc(credit.dataset.doc);
});

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
