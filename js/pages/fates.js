'use strict';

/* Судьбы христиан Гродненщины: пять глав по проблемному полю секции —
   вера накануне войны, мужество воинов, эвакуация 1915 года, Поместный собор и люди */

/* фильтр и поиск в базе людей сохраняются между перерисовками */
let peopleGroup = 'all';
let peopleQuery = '';

const personById = (id) => PEOPLE.find((person) => person.id === id);
/* число с пробелами между разрядами: 1 603 409 */
const groupDigits = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/* доля в процентах с запятой: 57,3 */
const percent = (n, total) => (Math.round((n / total) * 1000) / 10).toString().replace('.', ',');

/* рисует раздел */
function renderFates() {
  const p = texts();
  const ids = ['f-conf', 'f-valor', 'f-evac', 'f-sobor', 'f-people'];

  /* шапка главы: номер, заголовок, вводная строка */
  const chapterHead = (n, title, lead) => `
    <header class="chapter__head">
      <span class="chapter__num" aria-hidden="true">0${n}</span>
      <h3 class="chapter__title" id="h-${ids[n - 1]}">${esc(title)}</h3>
      ${lead ? `<p class="chapter__lead">${esc(lead)}</p>` : ''}
    </header>`;

  /* 1. перепись 1897 года */
  const rows = CONFESSIONS.rows;
  const bar = rows
    .map(
      ([key, label, n]) =>
        `<span class="census__part census__part--${key}" style="flex-grow: ${n}" title="${esc(tr(label))}: ${percent(n, CONFESSIONS.total)} %"></span>`
    )
    .join('');
  const list = rows
    .map(
      ([key, label, n]) => `
        <li class="census__row">
          <span class="census__mark census__mark--${key}" aria-hidden="true"></span>
          <span class="census__name">${esc(tr(label))}</span>
          <span class="census__num">${groupDigits(n)}</span>
          <span class="census__pct">${percent(n, CONFESSIONS.total)} %</span>
        </li>`
    )
    .join('');

  /* 2. мужество воинов */
  const valor = VALOR.map((item) => {
    const action = item.person
      ? `<button class="tile__link" type="button" data-person="${item.person}">${esc(tr(personById(item.person).n))}</button>`
      : `<button class="tile__link" type="button" data-doc="${item.doc}">${esc(ui().open)}</button>`;
    return `
      <li class="tile">
        <div class="tile__media">
          <img class="tile__img" src="${thumb(item.img)}" alt="" loading="lazy" decoding="async">
          <span class="tile__date">${esc(tr(item.d))}</span>
        </div>
        <div class="tile__body">
          <h4 class="tile__title">${esc(tr(item.t))}</h4>
          <p class="tile__text">${esc(tr(item.x))}</p>
          ${item.credit ? `<p class="caption">${esc(tr(item.credit))}</p>` : ''}
          ${action}
        </div>
      </li>`;
  }).join('');

  /* 3. эвакуация: путь и судьбы святынь */
  const route = EVAC.route
    .map(
      ([place, when]) => `
        <li class="evac-route__stop">
          <span class="evac-route__dot" aria-hidden="true"></span>
          <span class="evac-route__place">${esc(tr(place))}</span>
          <span class="evac-route__when">${esc(tr(when))}</span>
        </li>`
    )
    .join('');
  const evac = EVAC.items
    .map(
      (item) => `
        <li class="evac__item evac__item--${item.st}">
          <span class="evac__status">${esc(p.fEvacSt[item.st])}</span>
          <h4 class="evac__title">${esc(tr(item.t))}</h4>
          <p class="evac__text">${esc(tr(item.x))}</p>
          ${item.person ? `<button class="tile__link" type="button" data-person="${item.person}">${esc(ui().more)}</button>` : ''}
        </li>`
    )
    .join('');

  /* 4. Поместный собор */
  const sobor = SOBOR.cards
    .map(([id, text]) => {
      const person = personById(id);
      return `
        <li class="sobor__card">
          <button class="sobor__who" type="button" data-person="${id}">
            <img class="sobor__face" src="${person.img}" alt="" loading="lazy" decoding="async">
            <span class="sobor__name">${esc(tr(person.n))}</span>
            <span class="sobor__years">${esc(person.y)}</span>
          </button>
          <p class="sobor__text">${esc(tr(text))}</p>
        </li>`;
    })
    .join('');

  $('#v-fates').innerHTML =
    pageHead('fates', p.fH, p.fLead) +
    `
    <div class="container">
      <nav class="chapters" aria-label="${esc(p.fH)}">
        ${p.fNav.map((name, i) => `<button class="chapters__link" type="button" data-go="${ids[i]}"><span class="chapters__num">0${i + 1}</span>${esc(name)}</button>`).join('')}
      </nav>

      <section class="chapter" id="f-conf" aria-labelledby="h-f-conf">
        ${chapterHead(1, p.fConfH, p.fConfLead)}
        <div class="census">
          <div class="census__facts">
            <p class="census__big">${groupDigits(CONFESSIONS.total)}<span class="census__unit">${esc(p.fPeople)}</span></p>
            <p class="census__big census__big--gold">${percent(CONFESSIONS.christians, CONFESSIONS.total)} %<span class="census__unit">${esc(p.fChristians)}</span></p>
          </div>
          <div class="census__bar" aria-hidden="true">${bar}</div>
          <ul class="census__list">${list}</ul>
          <p class="caption">${esc(tr(CONFESSIONS.src))}</p>
        </div>
      </section>
    </div>

    <div class="band band--soft">
      <div class="container">
        <section class="chapter" id="f-valor" aria-labelledby="h-f-valor">
          ${chapterHead(2, p.fValorH)}
          <ul class="tiles">${valor}</ul>
        </section>
      </div>
    </div>

    <div class="container">
      <section class="chapter" id="f-evac" aria-labelledby="h-f-evac">
        ${chapterHead(3, p.fEvacH, p.fEvacLead)}
        <ol class="evac-route">${route}</ol>
        <ul class="evac">${evac}</ul>
        <p class="caption">${esc(tr(EVAC.src))}</p>
      </section>

      <section class="chapter" id="f-sobor" aria-labelledby="h-f-sobor">
        ${chapterHead(4, p.fSoborH)}
        <div class="sobor">
          <figure class="sobor__photo">
            <img class="sobor__img" src="${thumb(SOBOR.img)}" alt="${esc(tr(SOBOR.cap))}" loading="lazy" decoding="async">
            <figcaption class="caption">${esc(tr(SOBOR.cap))}</figcaption>
          </figure>
          <div class="sobor__side">
            <p class="sobor__lead">${esc(tr(SOBOR.lead))}</p>
            <ul class="sobor__list">${sobor}</ul>
            <p class="caption">${esc(tr(SOBOR.src))}</p>
          </div>
        </div>
      </section>

      <section class="chapter" id="f-people" aria-labelledby="h-f-people">
        ${chapterHead(5, p.fPeopleH, p.fPeopleLead)}
        <div class="people-tools">
          <div class="filters" id="p-groups" role="group" aria-label="${esc(p.fPeopleH)}"></div>
          <label class="search">
            <svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input class="search__input" type="search" id="p-q" placeholder="${esc(p.fSearch)}" aria-label="${esc(p.fSearch)}">
          </label>
        </div>
        <p class="caption people-count" id="p-count" aria-live="polite"></p>
        <ul class="people" id="people"></ul>
      </section>
    </div>
  `;

  /* оглавление: прокрутка к главе */
  $$('.chapters__link').forEach((link) =>
    link.addEventListener('click', () => $('#' + link.dataset.go).scrollIntoView({ block: 'start' }))
  );

  /* кнопки «человек» и «документ» в главах */
  $$('#v-fates [data-person]').forEach((button) =>
    button.addEventListener('click', () => openPerson(button.dataset.person))
  );
  $$('#v-fates [data-doc]').forEach((button) =>
    button.addEventListener('click', () => openDoc(button.dataset.doc))
  );

  /* база людей: группа и поиск */
  const groups = Object.entries(p.fGroups);
  renderFilters($('#p-groups'), groups, peopleGroup, (key) => {
    peopleGroup = key;
    paintPeople();
  });
  const search = $('#p-q');
  search.value = peopleQuery;
  search.addEventListener('input', () => {
    peopleQuery = search.value;
    paintPeople();
  });
  paintPeople();
}

/* перерисовывает карточки людей */
function paintPeople() {
  const p = texts();
  const list = $('#people');
  const query = peopleQuery.trim().toLowerCase();
  const shown = PEOPLE.filter((person) => {
    if (peopleGroup !== 'all' && person.g !== peopleGroup) return false;
    return !query || [tr(person.n), tr(person.r), tr(person.bio)].join(' ').toLowerCase().includes(query);
  });

  $('#p-count').textContent = p.fCount(shown.length);
  list.innerHTML = '';
  if (!shown.length) {
    list.append(createEl('li', 'empty-state', ui().none));
    return;
  }

  shown.forEach((person) => {
    const face = person.img
      ? `<img class="person__img" src="${person.img}" alt="" loading="lazy" decoding="async">`
      : `<span class="person__img person__img--empty" aria-hidden="true">${esc(tr(person.n).split(' ').pop()[0])}</span>`;
    const button = createEl('button', 'person');
    button.type = 'button';
    button.innerHTML = `
      <span class="person__media">
        ${face}
        <span class="person__group">${esc(p.fGroups[person.g])}</span>
      </span>
      <span class="person__body">
        <span class="person__name">${esc(tr(person.n))}</span>
        ${person.y ? `<span class="person__years">${esc(person.y)}</span>` : ''}
        <span class="person__role">${esc(tr(person.r))}</span>
      </span>
    `;
    button.addEventListener('click', () => openPerson(person.id));
    const item = createEl('li', 'people__item');
    item.append(button);
    list.append(item);
  });
}

/* карточка человека в окне: биография, связанные документы и источник */
function openPerson(id) {
  const p = texts();
  const person = personById(id);
  const docs = person.docs.length
    ? `<p class="eyebrow">${esc(p.fDocs)}</p>
       <div class="modal__links">${person.docs
         .map(
           (doc) =>
             `<button class="button button--small" type="button" data-open-doc="${doc}">${esc(tr(DOCS[doc].t))}</button>`
         )
         .join('')}</div>`
    : '';
  openModal(
    `
    ${person.img ? `<img class="modal__img modal__img--portrait" src="${person.img}" alt="${esc(tr(person.n))}">` : ''}
    <div>
      <p class="eyebrow">${esc(p.fGroups[person.g])}${person.y ? ' · ' + esc(person.y) : ''}</p>
      <h3 class="modal__title" id="m-title">${esc(tr(person.n))}</h3>
      <p class="modal__role">${esc(tr(person.r))}</p>
      <p>${esc(tr(person.bio))}</p>
      ${listenHtml('person-' + person.id)}
      ${docs}
      <p class="modal__source">${esc(ui().source)}: ${esc(tr(person.src))}</p>
    </div>
  `,
    !person.img
  );
  $$('[data-open-doc]', modalBody).forEach((button) =>
    button.addEventListener('click', () => openDoc(button.dataset.openDoc))
  );
}
