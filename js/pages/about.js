'use strict';

/* О проекте: цифры, соответствие проблемному полю секции II и вкладки с материалами исследования */

/* какие блоки ABOUT попадают на вкладки (номера по порядку в данных) */
const ABOUT_TABS = [
  [0, 1, 2, 3, 4, 5, 14, 7],
  [8, 9, 6],
  [10, 11, 12, 13],
  [15, 16, 17, 18]
];
/* блок с авторами показываем под заголовком страницы */
const ABOUT_AUTHORS = 19;
let aboutTab = 0;

/* один блок «О проекте»: текст или список (выводы — нумерованные) */
function aboutItem([mod, title, body]) {
  const tag = mod === 'numbered' ? 'ol' : 'ul';
  const listMod = mod === 'numbered' ? ' about__list--numbered' : '';
  const content = Array.isArray(body)
    ? `<${tag} class="about__list${listMod}">${body.map((line) => `<li>${esc(line)}</li>`).join('')}</${tag}>`
    : `<p class="about__text">${esc(body)}</p>`;
  return `
    <section class="about__item${mod ? ' about__item--' + mod : ''}">
      <h4 class="about__title">${esc(title)}</h4>
      ${content}
    </section>`;
}

/* рисует раздел */
function renderAbout() {
  const p = texts();
  const blocks = ABOUT[lang];

  const stats = p.abStats
    .map(
      ([num, label]) => `
        <li class="stat">
          <span class="stat__num">${esc(num)}</span>
          <span class="stat__label">${esc(label)}</span>
        </li>`
    )
    .join('');

  /* пункты проблемного поля секции и раздел, где о них рассказано */
  const sec = p.sec
    .map(
      ([point, what, name, block], i) => `
        <li class="sec__item">
          <span class="sec__num" aria-hidden="true">${i + 1}</span>
          <p class="sec__point">${esc(point)}</p>
          <p class="sec__what">${esc(what)}</p>
          <button class="tile__link" type="button" data-route="${name}" data-block="${block}">${esc(p.secGo)}: ${esc(ui().nav[name])}</button>
        </li>`
    )
    .join('');

  /* ресурсы в интернете открываются в новой вкладке */
  const links = `
    <section class="about__item">
      <h4 class="about__title">${esc(p.linksH)}</h4>
      <ul class="about__list about__list--links">${LINKS.map(
        ([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${esc(tr(label))}</a></li>`
      ).join('')}</ul>
    </section>`;

  const tabs = p.abTabs
    .map(
      (name, t) =>
        `<button class="tabs__btn" type="button" role="tab" id="ab-tab-${t}" aria-controls="ab-panel-${t}" aria-selected="${t === aboutTab}" tabindex="${t === aboutTab ? 0 : -1}">${esc(name)}</button>`
    )
    .join('');
  const panels = ABOUT_TABS.map(
    (ids, t) => `
      <div class="about" id="ab-panel-${t}" role="tabpanel" aria-labelledby="ab-tab-${t}"${t === aboutTab ? '' : ' hidden'}>
        ${ids.map((i) => aboutItem(blocks[i])).join('')}
        ${t === ABOUT_TABS.length - 1 ? links : ''}
      </div>`
  ).join('');

  $('#v-about').innerHTML =
    pageHead('about', p.abH) +
    `
    <div class="container">
      <p class="about-authors">${esc(blocks[ABOUT_AUTHORS][2])}</p>
      <ul class="stats">${stats}</ul>

      <section class="sec" aria-labelledby="h-sec">
        <h3 class="sec__title" id="h-sec">${esc(p.secH)}</h3>
        <p class="sec__lead">${esc(p.secLead)}</p>
        <ol class="sec__list">${sec}</ol>
      </section>

      <div class="tabs" role="tablist" aria-label="${esc(p.abH)}">${tabs}</div>
      ${panels}
    </div>
  `;

  /* «Открыть»: переход в раздел и к нужной главе */
  $$('#v-about [data-route]').forEach((button) =>
    button.addEventListener('click', () => goTo(button.dataset.route, button.dataset.block))
  );

  /* вкладки: нажатие и стрелки влево-вправо */
  const tabButtons = $$('.tabs__btn', $('#v-about'));
  const select = (t, focus) => {
    aboutTab = t;
    tabButtons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === t));
      button.tabIndex = i === t ? 0 : -1;
      $('#ab-panel-' + i).hidden = i !== t;
    });
    if (focus) tabButtons[t].focus();
  };
  tabButtons.forEach((button, t) => {
    button.addEventListener('click', () => select(t, false));
    button.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      select((t + step + tabButtons.length) % tabButtons.length, true);
    });
  });
}
