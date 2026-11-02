'use strict';

/* Архив: подлинные документы с фильтром по типу и поиском */

/* выбранный тип документов и текст поиска */
let archiveType = 'all';
let archiveQuery = '';

/* рисует раздел: фильтры, поиск и список */
function renderArchive() {
  const p = texts();
  $('#v-archive').innerHTML =
    pageHead('archive', p.arH, p.arLead) +
    `
    <div class="container">
      <div class="archive-tools">
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

      <section class="glossary" aria-labelledby="h-gloss">
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

  paintDocs();
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
      <span class="doc__frame"><img class="doc__img" src="${thumb(doc.img)}" alt="" loading="lazy"></span>
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
