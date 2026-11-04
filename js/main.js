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
  quiz: renderQuiz
};
const ROUTE_NAMES = Object.keys(ROUTES);
/* текущий раздел */
let route = 'home';

/* раздел из адреса; неизвестный адрес ведёт на главную */
function readRoute() {
  /* адрес вида #fates/f-evac — раздел и блок, к которому прокрутить */
  const [name, block] = location.hash.slice(1).split('/');
  if (block && /^[a-z0-9-]+$/.test(block)) routeFocus = block;
  return ROUTE_NAMES.includes(name) ? name : 'home';
}

/* Показывает нужный раздел и прячет остальные */
function showRoute() {
  route = readRoute();
  $$('.page').forEach((page) => page.classList.toggle('page--active', page.id === 'v-' + route));
  ROUTES[route]();
  paintPager();
  markNav();
  toggleMenu(false, $('#main'));
  window.scrollTo(0, 0);
  paintHeader();
  reveal($('#v-' + route));
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
    quiz: p.qzH
  };
  return titles[name];
}

/* навигация внизу раздела: куда идти назад и дальше */
function paintPager() {
  const pager = $('#pager');
  const index = SECTION_ORDER.indexOf(route);
  pager.hidden = index < 0;
  if (index < 0) return;

  /* перед первым и после последнего раздела — главная */
  const prev = index === 0 ? 'home' : SECTION_ORDER[index - 1];
  const next = index === SECTION_ORDER.length - 1 ? 'home' : SECTION_ORDER[index + 1];
  const step = (name) => {
    const n = SECTION_ORDER.indexOf(name);
    return n < 0 ? '' : `<span class="pager__num"> · ${esc(ui().pagerStep(n + 1))}</span>`;
  };

  /* слева — «Назад», справа — «Дальше»; у каждой половины снимок своего зала */
  const half = (name, dir, side) => {
    const [img, pos] = PAGE_IMG[name] || ['img/kolozha-1915.jpg', '50% 45%'];
    return `
      <a class="pager__link pager__link--${side}" href="#${name}">
        <img class="pager__img" src="${thumb(img)}" alt="" loading="lazy" decoding="async" style="object-position: ${pos}">
        <span class="pager__dir">${dir}</span>
        <span class="pager__title">${esc(sectionTitle(name))}</span>
      </a>`;
  };
  pager.innerHTML = `
    <div class="pager__inner">
      ${half(prev, `← ${esc(ui().prev)}${step(prev)}`, 'prev')}
      ${half(next, `${esc(ui().next)}${step(next)} →`, 'next')}
    </div>
  `;
}

/* подсвечивает текущий раздел в меню */
function markNav() {
  $$('.main-nav__link, .menu__link').forEach((link) => {
    if (link.getAttribute('href') === '#' + route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* Меню-оглавление залов на весь экран */
const menu = $('#drawer');
const menuButton = $('#burger');

/* рисует оглавление: главная и восемь залов с номером и коротким описанием */
function paintMenu() {
  const halls = Object.fromEntries(texts().kleyma.map((hall) => [hall[0], hall]));
  const item = (name, num, title, text) => `
    <li class="menu__item">
      <a class="menu__link" href="#${name}">
        <span class="menu__num">${num}</span>
        <span class="menu__name">${esc(title)}</span>
        ${text ? `<span class="menu__text">${esc(text)}</span>` : ''}
      </a>
    </li>`;
  $('#menu-list').innerHTML = `
    <p class="menu__kicker">${esc(texts().hallsKicker)} · ${esc(ui().brand)}</p>
    <ol class="menu__list">
      ${item('home', '00', ui().nav.home, '')}
      ${SECTION_ORDER.map((name, i) => item(name, String(i + 1).padStart(2, '0'), halls[name][2], halls[name][3])).join('')}
    </ol>
    <p class="menu__foot">${esc(ui().foot1)}</p>`;
}

/* открывает или закрывает меню; фокус — на первый пункт, при закрытии — на кнопку
   или, после перехода в другой зал, на его содержимое */
function toggleMenu(open, focusAfter = menuButton) {
  const wasOpen = menu.classList.contains('menu--open');
  menu.classList.toggle('menu--open', open);
  document.documentElement.classList.toggle('is-locked', open);
  menuButton.setAttribute('aria-expanded', String(open));
  paintHeader();
  if (open && !wasOpen) $('.menu__link', menu).focus();
  if (!open && wasOpen && menu.contains(document.activeElement)) focusAfter.focus({ preventScroll: true });
}

menuButton.addEventListener('click', () => toggleMenu(!menu.classList.contains('menu--open')));

/* шапка прозрачная, пока виден снимок в начале страницы; при открытом меню — всегда светлая */
const header = $('.site-header');
function paintHeader() {
  header.classList.toggle('site-header--clear', scrollY < 24 && !menu.classList.contains('menu--open'));
}
addEventListener('scroll', paintHeader, { passive: true });
/* ссылка на уже открытый раздел не меняет адрес — закрываем меню вручную */
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) toggleMenu(false, $('#main'));
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
  paintMenu();
  markNav();
}

$$('.lang-switch__btn').forEach((button) =>
  button.addEventListener('click', () => {
    if (button.dataset.lang === lang) return;
    lang = button.dataset.lang;
    store.set('lang', lang);
    translateStatic();
    ROUTES[route]();
    paintPager();
    reveal($('#v-' + route));
  })
);

/* офлайн-режим: сервис-воркер работает только по http(s); открытому с диска сайту он не нужен */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js');
}

addEventListener('hashchange', showRoute);
translateStatic();
showRoute();
