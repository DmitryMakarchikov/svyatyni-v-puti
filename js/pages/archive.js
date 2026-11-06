'use strict';

/* Архив: подлинные документы с фильтром по типу и поиском, словарь и семейный архив */

/* выбранный тип документов и текст поиска */
let archiveType = 'all';
let archiveQuery = '';

/* ссылка на публикацию: на экране — только имя сайта */
function siteLink(url, cls) {
  if (!url) return '';
  const site = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  return `<a class="${cls}" href="${url}" target="_blank" rel="noopener">${esc(site)}</a>`;
}

/* дела НИАБ в г. Гродно: дата, шифр, что в деле и где опубликовано */
function niabHtml() {
  const p = texts();
  const cases = NIAB_CASES.map(
    (item) => `
      <li class="case">
        <p class="case__date">${esc(tr(item.d))}</p>
        <h4 class="case__title">${esc(tr(item.t))}</h4>
        <p class="case__code">${esc(tr(item.code))}</p>
        <p class="case__text">${esc(tr(item.x))}</p>
        <p class="case__src">${esc(p.niabSrc)}: ${esc(item.src)}. ${siteLink(item.url, 'case__link')}</p>
      </li>`
  ).join('');
  return `
    <section class="niab" id="niab" aria-labelledby="h-niab">
      <h3 class="niab__title" id="h-niab">${esc(p.niabH)}</h3>
      <p class="niab__lead">${esc(p.niabLead)}</p>
      <ol class="niab__list">${cases}</ol>
    </section>`;
}

/* истории беженцев: кто, откуда и куда, рассказ и источник */
function storiesHtml() {
  const p = texts();
  const items = STORIES.map(
    (story) => `
      <li class="story">
        <p class="story__route">${esc(tr(story.route))}</p>
        <h4 class="story__who">${esc(tr(story.who))}</h4>
        <p class="story__text">${esc(tr(story.x))}</p>
        <p class="story__src">${esc(ui().source)}: ${esc(story.src)}. ${siteLink(story.url, 'story__link')}</p>
      </li>`
  ).join('');
  return `
    <section class="stories" id="stories" aria-labelledby="h-stories">
      <h3 class="stories__title" id="h-stories">${esc(p.storiesH)}</h3>
      <p class="stories__lead">${esc(p.storiesLead)}</p>
      <ul class="stories__list">${items}</ul>
    </section>`;
}

/* полный список источников по группам; ссылка — на сайт источника */
function sourcesHtml() {
  const p = texts();
  const count = SOURCES.reduce((n, group) => n + group.items.length, 0);
  const groups = SOURCES.map(
    (group) => `
      <div class="sources__group">
        <h4 class="sources__group-title">${esc(tr(group.t))}</h4>
        <ul class="sources__list">${group.items
          .map(([text, url]) => {
            const link = url ? ' — ' + siteLink(url, 'sources__link') : '';
            return `<li class="sources__item">${esc(tr(text))}${link}</li>`;
          })
          .join('')}</ul>
      </div>`
  ).join('');
  return `
    <section class="sources" id="sources" aria-labelledby="h-sources">
      <h3 class="sources__title" id="h-sources">${esc(p.srcH)}</h3>
      <p class="sources__lead">${esc(p.srcLead)} ${esc(p.srcCount(count))}.</p>
      <p class="sources__data">${esc(p.srcData)}</p>
      <div class="sources__groups">${groups}</div>
    </section>`;
}

/* рисует раздел: фильтры, поиск и список */
function renderArchive() {
  const p = texts();
  $('#v-archive').innerHTML =
    pageHead('archive', p.arH, p.arLead) +
    `
    <div class="container">
      <nav class="chapters" aria-label="${esc(p.arH)}">
        ${p.arNav
          .map(
            (name, i) =>
              `<button class="chapters__link" type="button" data-go="${['a-docs', 'letter', 'niab', 'glossary', 'stories', 'family', 'sources'][i]}"><span class="chapters__num">0${i + 1}</span>${esc(name)}</button>`
          )
          .join('')}
      </nav>
      <div class="archive-tools" id="a-docs">
        <div class="filters" id="atypes" role="group" aria-label="${esc(p.arTypes)}"></div>
        <label class="search">
          <svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input class="search__input" type="search" id="a-q" placeholder="${esc(ui().search)}" aria-label="${esc(ui().search)}">
        </label>
      </div>
      <ul class="docs" id="docs"></ul>

      ${letterHtml()}

      ${niabHtml()}

      <section class="glossary" id="glossary" aria-labelledby="h-gloss">
        <h3 class="glossary__title" id="h-gloss">${esc(p.glossH)}</h3>
        <p class="glossary__lead">${esc(p.glossLead)}</p>
        <div class="glossary__list">
          ${GLOSSARY.map(
            ([term, text]) => `
              <details class="term">
                <summary class="term__name">${esc(tr(term))}</summary>
                <p class="term__text">${esc(tr(text))}</p>
              </details>`
          ).join('')}
        </div>
      </section>

      ${storiesHtml()}

      <div id="family"></div>

      ${sourcesHtml()}
    </div>
  `;

  const types = [['all', ui().all], ...Object.entries(DOC_TYPES).map(([key, label]) => [key, tr(label)])];
  renderFilters($('#atypes'), types, archiveType, (key) => {
    archiveType = key;
    paintDocs();
  });

  const search = $('#a-q');
  search.value = archiveQuery;
  search.addEventListener('input', () => {
    archiveQuery = search.value;
    paintDocs();
  });

  /* оглавление: прокрутка к блоку */
  $$('#v-archive .chapters__link').forEach((link) =>
    link.addEventListener('click', () => $('#' + link.dataset.go).scrollIntoView({ block: 'start' }))
  );

  paintDocs();
  bindLetter();
  renderFamily($('#family'));
}

/* перерисовывает список документов по фильтру и поиску */
function paintDocs() {
  const list = $('#docs');
  const query = archiveQuery.trim().toLowerCase();
  list.innerHTML = '';

  /* ищем по названию, описанию и подписи на текущем языке */
  const ids = Object.keys(DOCS).filter((id) => {
    const doc = DOCS[id];
    if (archiveType !== 'all' && doc.type !== archiveType) return false;
    if (!query) return true;
    return [tr(doc.t), tr(doc.x), tr(doc.cap)].join(' ').toLowerCase().includes(query);
  });

  if (!ids.length) {
    list.append(createEl('li', 'empty-state', ui().none));
    return;
  }

  ids.forEach((id) => {
    const doc = DOCS[id];
    const badge = progress.found.includes(id)
      ? `<span class="doc__badge">${esc(ui().foundInGame)}</span>`
      : '';

    const button = createEl('button', 'doc');
    button.type = 'button';
    button.innerHTML = `
      <span class="doc__frame"><img class="doc__img" ${thumbAttrs(doc.img, '(max-width: 600px) 42vw, 260px')} alt="" loading="lazy" decoding="async"></span>
      <span class="eyebrow doc__type">${esc(tr(doc.cap))}</span>
      <span class="doc__title">${esc(tr(doc.t))}</span>
      ${badge}
    `;
    button.addEventListener('click', () => openDoc(id));

    const item = createEl('li', 'docs__item');
    item.append(button);
    list.append(item);
  });
}
