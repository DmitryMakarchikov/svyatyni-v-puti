'use strict';

/* Запуск: роутер по адресу (#chronicle, #map …), меню, язык и клавиатура */

const ROUTES = {
  home: renderHome,
  chronicle: renderChronicle,
  map: renderMap,
  fates: renderFates,
  shrines: renderShrines,
  comic: renderComic,
  game: renderGame,
  archive: renderArchive,
  quiz: renderQuiz,
  about: renderAbout
};
const ROUTE_NAMES = Object.keys(ROUTES);
/* текущий раздел */
let route = 'home';

/* раздел из адреса; неизвестный адрес ведёт на главную */
function readRoute() {
  const hash = location.hash.slice(1);
  return ROUTE_NAMES.includes(hash) ? hash : 'home';
}

/* Показывает нужный раздел и прячет остальные */
function showRoute() {
  route = readRoute();
  $$('.page').forEach((page) => page.classList.toggle('page--active', page.id === 'v-' + route));
  ROUTES[route]();
  paintPager();
  markNav();
  toggleMenu(false);
  window.scrollTo(0, 0);
  focusBlock();
}

/* заголовок раздела на текущем языке */
function sectionTitle(name) {
  const p = texts();
  const titles = {
    home: ui().nav.home,
    chronicle: p.chrH,
    map: p.mapH,
    fates: p.fH,
    shrines: p.shH,
    comic: p.coH,
    game: gameTexts().title,
    archive: p.arH,
    quiz: p.qzH,
    about: ui().nav.about
  };
  return titles[name];
}

/* навигация внизу раздела: куда идти назад и дальше */
function paintPager() {
  const pager = $('#pager');
  const index = SECTION_ORDER.indexOf(route);
  pager.hidden = index < 0;
  if (index < 0) return;

  /* перед первым разделом — главная, после последнего — «О проекте» */
  const prev = index === 0 ? 'home' : SECTION_ORDER[index - 1];
  const next = index === SECTION_ORDER.length - 1 ? 'about' : SECTION_ORDER[index + 1];
  const step = (name) => {
    const n = SECTION_ORDER.indexOf(name);
    return n < 0 ? '' : `<span class="pager__num"> · ${esc(ui().pagerStep(n + 1))}</span>`;
  };

  pager.innerHTML = `
    <div class="container pager__inner">
      <a class="pager__link" href="#${prev}">
        <span class="pager__dir">← ${esc(ui().prev)}${step(prev)}</span>
        <span class="pager__title">${esc(sectionTitle(prev))}</span>
      </a>
      <a class="pager__link pager__link--next" href="#${next}">
        <span class="pager__dir">${esc(ui().next)}${step(next)} →</span>
        <span class="pager__title">${esc(sectionTitle(next))}</span>
      </a>
    </div>
  `;
}

/* подсвечивает текущий раздел в меню */
function markNav() {
  $$('.main-nav__link, .mobile-nav__link').forEach((link) => {
    if (link.getAttribute('href') === '#' + route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* Мобильное меню */
const menu = $('#drawer');
const menuButton = $('#burger');

/* открывает или закрывает мобильное меню */
function toggleMenu(open) {
  menu.classList.toggle('mobile-nav--open', open);
  menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.addEventListener('click', () => toggleMenu(!menu.classList.contains('mobile-nav--open')));
/* ссылка на уже открытый раздел не меняет адрес — закрываем меню вручную */
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) toggleMenu(false);
});

/* «Путевой лист» со всеми печатями */
$('#pass-btn').addEventListener('click', () => {
  const names = ui().stamps;
  const items = STAMP_KEYS.map(
    (key, i) => `
      <li class="stamps__item">
        <a class="stamp${progress.stamps[key] ? ' stamp--on' : ''}" href="#${key}">
          <span class="stamp__seal" aria-hidden="true">${i + 1}</span>
          <span class="stamp__title">${esc(names[key][0])}</span>
          <span class="stamp__text">${esc(names[key][1])}</span>
        </a>
      </li>`
  ).join('');

  openModal(
    `
    <div>
      <p class="eyebrow">${countStamps()}/6</p>
      <h3 class="modal__title" id="m-title">${esc(ui().passTitle)}</h3>
      <p>${esc(ui().passLead)}</p>
      <ul class="stamps">${items}</ul>
    </div>
  `,
    true
  );
  $$('.stamp', modal).forEach((link) => link.addEventListener('click', closeModal));
});

/* «К содержанию»: адрес занят разделами, поэтому просто переводим фокус на main */
$('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  $('#main').focus();
});

/* Клавиатура: стрелки листают сказание и делают выбор в игре, Esc закрывает меню */
document.addEventListener('keydown', (e) => {
  if (viewer.open) {
    if (e.key === 'ArrowRight') stepViewer(1);
    if (e.key === 'ArrowLeft') stepViewer(-1);
    return;
  }
  if (modal.open) return;
  if (e.key === 'Escape') toggleMenu(false);
  if (route === 'game') handleGameKeys(e);
});

/* Язык: data-i — текст элемента, data-i-label — его aria-label (путь вида "nav.map") */
const pickText = (path) => path.split('.').reduce((obj, key) => (obj ? obj[key] : undefined), ui());

/* переводит надписи, которые есть прямо в index.html */
function translateStatic() {
  document.documentElement.lang = lang;
  document.title = ui().brand;
  $$('[data-i]').forEach((node) => {
    const text = pickText(node.dataset.i);
    if (typeof text === 'string') node.textContent = text;
  });
  $$('[data-i-label]').forEach((node) => {
    const text = pickText(node.dataset.iLabel);
    if (typeof text === 'string') node.setAttribute('aria-label', text);
  });
  $$('.lang-switch__btn').forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.lang === lang))
  );
  $('#pass-btn').title = ui().passport;
  paintPassport();
}

$$('.lang-switch__btn').forEach((button) =>
  button.addEventListener('click', () => {
    if (button.dataset.lang === lang) return;
    lang = button.dataset.lang;
    store.set('lang', lang);
    translateStatic();
    ROUTES[route]();
    paintPager();
    /* на телефоне видна только кнопка другого языка — возвращаем на неё фокус */
    const visible = $$('.lang-switch__btn').find((b) => b.offsetParent !== null);
    if (visible && !button.offsetParent) visible.focus();
  })
);

/* офлайн-режим: сервис-воркер работает только по http(s); открытому с диска сайту он не нужен */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}

addEventListener('hashchange', showRoute);
translateStatic();
showRoute();
