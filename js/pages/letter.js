'use strict';

/* «Документ под лупой» на странице «Архив»: письмо Комитета великой княжны Татьяны Николаевны 1915 года.
   Скан двух страниц с лупой, текст воззвания в старой и современной орфографии, справка и вопросы к уроку */

/* выбранная страница и вид текста сохраняются между перерисовками */
let letterPage = '73';
let letterMode = 'old';

const letterImg = (page) => `img/gev-1915-p${page}.jpg`;

/* разметка блока */
function letterHtml() {
  const p = texts();
  const rules = LETTER.rules
    .map(
      ([was, now, example]) => `
        <li class="letter__rule">
          <span class="letter__glyph" lang="ru">${esc(was)}</span>
          <span class="letter__now">→ ${esc(tr(now))}</span>
          <span class="letter__example" lang="ru">${esc(example)}</span>
        </li>`
    )
    .join('');
  const facts = LETTER.facts
    .map(
      ([term, text]) => `
        <div class="letter__fact">
          <dt class="eyebrow">${esc(tr(term))}</dt>
          <dd>${esc(tr(text))}</dd>
        </div>`
    )
    .join('');

  return `
    <section class="letter" id="letter" aria-labelledby="h-letter">
      <h3 class="letter__title" id="h-letter">${esc(p.lupaH)}</h3>
      <p class="letter__lead">${esc(p.lupaLead)}</p>
      <div class="letter__layout">
        <div class="letter__scan">
          <div class="filters" id="l-pages" role="group" aria-label="${esc(p.lupaPages)}"></div>
          <button class="letter__frame" type="button" id="l-frame">
            <img class="letter__img" id="l-img" src="${letterImg(letterPage)}" alt="" width="900" height="1436" loading="lazy">
            <span class="letter__lens" id="l-lens" aria-hidden="true"></span>
          </button>
        </div>
        <div class="letter__body">
          <div class="filters" id="l-modes" role="group" aria-label="${esc(p.lupaModes)}"></div>
          <blockquote class="letter__text" id="l-text"></blockquote>
          ${p.lupaNote ? `<p class="caption">${esc(p.lupaNote)}</p>` : ''}
          <details class="letter__rules">
            <summary class="letter__rules-title">${esc(p.lupaRulesH)}</summary>
            <ul class="letter__rule-list">${rules}</ul>
            <p class="caption">${esc(tr(LETTER.ruleNote))}</p>
          </details>
        </div>
      </div>
      <h4 class="letter__subtitle">${esc(p.lupaFactsH)}</h4>
      <dl class="letter__facts">${facts}</dl>
      <h4 class="letter__subtitle">${esc(p.lupaAskH)}</h4>
      <ol class="letter__ask">${tr(LETTER.ask)
        .map((q) => `<li>${esc(q)}</li>`)
        .join('')}</ol>
    </section>`;
}

/* оживляет блок после вставки разметки */
function bindLetter() {
  const p = texts();
  const frame = $('#l-frame');
  const img = $('#l-img');
  const lens = $('#l-lens');
  const text = $('#l-text');

  /* страница скана */
  const paintPage = () => {
    img.src = letterImg(letterPage);
    img.alt = p.lupaAlt(letterPage);
    frame.setAttribute('aria-label', p.lupaOpen(letterPage));
    lens.style.backgroundImage = `url("${img.src}")`;
  };
  renderFilters(
    $('#l-pages'),
    LETTER.pages.map((n) => [n, p.lupaPage(n)]),
    letterPage,
    (key) => {
      letterPage = key;
      paintPage();
    }
  );

  /* текст: как напечатано в 1915 году или современным языком (по-белорусски — перевод) */
  const paintText = () => {
    const old = letterMode === 'old';
    text.lang = old ? 'ru' : lang;
    text.classList.toggle('letter__text--old', old);
    text.innerHTML = (old ? LETTER.old : tr(LETTER.modern)).map((para) => `<p>${esc(para)}</p>`).join('');
  };
  renderFilters(
    $('#l-modes'),
    [
      ['old', p.lupaOld],
      ['new', p.lupaNew]
    ],
    letterMode,
    (key) => {
      letterMode = key;
      paintText();
    }
  );

  /* лупа: круг с увеличенным сканом идёт за курсором (только там, где есть наведение мышью) */
  const ZOOM = 2.4;
  if (matchMedia('(hover: hover)').matches) {
    frame.addEventListener('pointermove', (e) => {
      const box = img.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      const r = lens.offsetWidth / 2;
      lens.style.transform = `translate(${x - r}px, ${y - r}px)`;
      lens.style.backgroundSize = `${box.width * ZOOM}px ${box.height * ZOOM}px`;
      lens.style.backgroundPosition = `${r - x * ZOOM}px ${r - y * ZOOM}px`;
    });
    frame.addEventListener('pointerenter', () => lens.classList.add('letter__lens--on'));
    frame.addEventListener('pointerleave', () => lens.classList.remove('letter__lens--on'));
  }

  /* нажатие открывает страницу крупно (на телефоне её можно увеличить пальцами) */
  frame.addEventListener('click', () =>
    openModal(
      `<h3 class="visually-hidden" id="m-title">${esc(p.lupaAlt(letterPage))}</h3>
       <img class="modal__img modal__img--page" src="${letterImg(letterPage)}" alt="${esc(p.lupaAlt(letterPage))}">`,
      true
    )
  );

  paintPage();
  paintText();
}
