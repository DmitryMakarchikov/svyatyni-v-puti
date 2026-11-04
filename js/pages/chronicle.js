'use strict';

/* Хроника 1914–2008: фильтр по годам и лента событий */

/* выбранный год в фильтре */
let chronYear = 'all';

/* рисует раздел: фильтр по годам и пустую ленту */
function renderChronicle() {
  const p = texts();
  $('#v-chronicle').innerHTML =
    pageHead('chronicle', p.chrH, p.chrLead) +
    `
    <div class="container">
      <div class="filters" id="yrs" role="group" aria-label="${esc(p.chrYears)}"></div>
      <ol class="timeline" id="tl"></ol>
    </div>
  `;

  const years = YEARS.map(([key, label]) => [key, label == null ? ui().all : tr(label)]);
  renderFilters($('#yrs'), years, chronYear, (key) => {
    chronYear = key;
    paintTimeline();
  });
  paintTimeline();
}

/* заполняет ленту событиями выбранного года */
function paintTimeline() {
  const list = $('#tl');
  list.innerHTML = '';

  let lastYear = '';
  CHRON.forEach((event, i) => {
    if (chronYear !== 'all' && event.y !== chronYear) return;
    /* крупный год перед первой карточкой каждой группы */
    if (event.y !== lastYear) {
      lastYear = event.y;
      const label = YEARS.find(([key]) => key === event.y);
      list.append(createEl('li', 'timeline__year', label ? tr(label[1]) : event.y));
    }
    const doc = event.doc ? DOCS[event.doc] : null;
    const picture = doc
      ? `<img class="event__img" src="${thumb(doc.img)}" alt="" loading="lazy" decoding="async">`
      : `<span class="event__noimg" aria-hidden="true">${event.y === 'after' ? '2008' : event.y}</span>`;

    const button = createEl('button', 'event' + (progress.events.includes(i) ? ' event--seen' : ''));
    button.type = 'button';
    button.innerHTML = `
      <span class="event__date"><span class="event__dot" aria-hidden="true"></span>${esc(tr(event.d))}</span>
      <span class="event__body">
        <span class="event__title">${esc(tr(event.t))}</span>
        <span class="event__text">${esc(tr(event.x))}</span>
        <span class="more">${esc(ui().more)} <span aria-hidden="true">→</span></span>
      </span>
      ${picture}
    `;
    button.addEventListener('click', () => openEvent(event, i, button));

    const item = createEl('li', 'timeline__item');
    item.append(button);
    list.append(item);
  });
}

/* открывает событие в окне вместе с документом */
function openEvent(event, i, button) {
  /* прочитанное событие отмечается ромбиком */
  if (remember('events', i)) button.classList.add('event--seen');

  const doc = event.doc ? DOCS[event.doc] : null;
  const text = `
    <p class="eyebrow">${esc(tr(event.d))}</p>
    <h3 class="modal__title" id="m-title">${esc(tr(event.t))}</h3>
    <p>${esc(tr(event.x))}</p>
  `;

  if (doc) {
    openModal(`
      <img class="modal__img" src="${doc.img}" alt="${esc(tr(doc.t))}">
      <div>
        ${text}
        <p class="modal__source">${esc(tr(doc.t))}. ${esc(tr(doc.src))}</p>
      </div>
    `);
  } else {
    openModal(`<div>${text}</div>`, true);
  }
}
