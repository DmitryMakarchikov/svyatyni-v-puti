'use strict';

/* Главная: Коложская церковь над Неманом на весь первый экран, вступление и цифры,
   пять глав проблемного поля секции II на линии пути, восемь залов экспозиции,
   голос 1915 года, «Было — стало», вопрос дня и свеча памяти */

/* номера глав и снимок к каждой: [картинка, кадр, годы] */
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const CHAPTER_IMG = [
  ['img/pokrov-grodno.webp', '50% 30%', '1897–1914'],
  ['img/osowiec-bomb.webp', '50% 50%', '1914–1915'],
  ['img/station-refugees.webp', '50% 45%', '1915'],
  ['img/sobor-1917.webp', '50% 45%', '1917–1918'],
  ['img/icon-augustow.webp', '50% 20%', '1915–2026']
];
/* ширина снимков на экране — по ней браузер выбирает размер файла */
const OPEN_SIZES = '(max-width: 700px) 90vw, 100vw';
const CHAPTER_SIZES = '(max-width: 900px) calc(100vw - 40px), 560px';
const CMP_SIZES = '(max-width: 1220px) calc(100vw - 40px), 1180px';

/* рисует главную страницу */
function renderHome() {
  const p = texts();
  /* вопрос дня меняется раз в сутки */
  const day = QUIZ[Math.floor(Date.now() / 864e5) % QUIZ.length];
  const kolozha = DOCS['d-kolozha'];
  const halls = Object.fromEntries(p.kleyma.map((hall) => [hall[0], hall]));

  /* цифры проекта */
  const figures = p.homeStats
    .map(
      ([num, label]) => `
        <li class="figures__item" data-reveal>
          <span class="figures__num">${esc(num)}</span>
          <span class="figures__label">${esc(label)}</span>
        </li>`
    )
    .join('');

  /* пять глав: пункт проблемного поля, снимок, годы и ссылка на главу */
  const chapters = p.sec
    .map(([point, what, name, block], i) => {
      const [img, pos, years] = CHAPTER_IMG[i];
      return `
        <li class="path__item" data-reveal>
          <span class="path__node" aria-hidden="true">${ROMAN[i]}</span>
          <figure class="path__media">
            <img class="path__img" ${imgAttrs(img, CHAPTER_SIZES)} alt="" loading="lazy" decoding="async" style="object-position: ${pos}">
          </figure>
          <div class="path__body">
            <p class="path__years">${ROMAN[i]} · ${esc(years)}</p>
            <h3 class="path__title">${esc(point)}</h3>
            <p class="path__text">${esc(what)}</p>
            <a class="path__link" href="#${name}${block ? '/' + block : ''}">${esc(p.chRead)} <span aria-hidden="true">→</span></a>
          </div>
        </li>`;
    })
    .join('');

  /* восемь залов в порядке маршрута */
  const hallCards = SECTION_ORDER.map((name, i) => {
    const [, img, title, text] = halls[name];
    return `
      <li class="halls__item" data-reveal>
        <a class="hall" href="#${name}">
          <span class="hall__frame"><img class="hall__img" ${thumbAttrs(img, '(max-width: 560px) calc(100vw - 40px), (max-width: 1100px) 45vw, 290px')} alt="" loading="lazy" decoding="async"></span>
          <span class="hall__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="hall__title">${esc(title)}</span>
          <span class="hall__text">${esc(text)}</span>
        </a>
      </li>`;
  }).join('');

  $('#v-home').innerHTML = `
    <header class="opening">
      <img class="opening__img" ${imgAttrs(kolozha.img, OPEN_SIZES)} alt="" fetchpriority="high">
      <div class="container opening__inner">
        <p class="opening__kicker">${esc(p.homeLab)}</p>
        <h1 class="opening__title" id="t-home">${esc(p.homeTitle)}</h1>
        <p class="opening__sub">${esc(p.homeSub)}</p>
        <div class="actions">
          <a class="button button--light" href="#home/chapters" id="open-go">
            ${esc(p.homeGo)} <span class="button__arrow" aria-hidden="true">↓</span>
          </a>
          <a class="button button--ghost" href="#game">${esc(p.homePlay)}</a>
        </div>
      </div>
      <button class="opening__credit" type="button" id="open-credit">${esc(tr(kolozha.t))} · ${esc(tr(kolozha.cap))}</button>
    </header>

    <section class="intro" aria-label="${esc(p.figuresLabel)}">
      <div class="container intro__inner">
        <p class="intro__text" data-reveal>${esc(p.homeHook)}</p>
        <ul class="figures">${figures}</ul>
      </div>
    </section>

    <section class="path" id="chapters" aria-labelledby="h-path">
      <div class="container">
        <header class="section-head" data-reveal>
          <p class="section-head__kicker">${esc(p.secKicker)}</p>
          <h2 class="section-head__title" id="h-path">${esc(p.secH)}</h2>
          <p class="section-head__lead">${esc(p.secLead)}</p>
        </header>
        <ol class="path__list">${chapters}</ol>
      </div>
    </section>

    <section class="halls" aria-labelledby="h-halls">
      <div class="container">
        <header class="section-head" data-reveal>
          <p class="section-head__kicker">${esc(p.hallsKicker)}</p>
          <h2 class="section-head__title" id="h-halls">${esc(p.kleymaH)}</h2>
          <p class="section-head__lead">${esc(p.kleymaCap)}</p>
        </header>
        <ol class="halls__list">${hallCards}</ol>
      </div>
    </section>

    <section class="voice" aria-labelledby="h-quote">
      <div class="container voice__inner">
        <img class="voice__img" src="${thumb(DOCS['d-gev'].img)}" alt="${esc(tr(DOCS['d-gev'].t))}" loading="lazy" decoding="async">
        <div class="voice__body" data-reveal>
          <h2 class="voice__kicker" id="h-quote">${esc(p.quoteH)}</h2>
          <figure class="voice__figure">
            <blockquote class="voice__text">«${esc(p.quote)}»</blockquote>
            <figcaption class="voice__src">${esc(p.quoteSrc)}${p.quoteNote ? ' ' + esc(p.quoteNote) : ''}</figcaption>
          </figure>
          <button class="button button--light button--small" type="button" id="quote-doc">${esc(p.quoteBtn)}</button>
        </div>
      </div>
    </section>

    <div class="container">
      <section class="home-section" aria-labelledby="h-compare">
        <header class="section-head" data-reveal>
          <h2 class="section-head__title" id="h-compare">${esc(p.cmpH)}</h2>
          <p class="section-head__lead">${esc(p.cmpCap)}</p>
        </header>
        <div class="compare" id="cmp" style="--p: 50%">
          <img class="compare__img" ${imgAttrs('img/kolozha-today.webp', CMP_SIZES)} alt="${esc(tr(DOCS['d-kolozha-today'].t))}" loading="lazy" decoding="async">
          <img class="compare__img compare__img--top" ${imgAttrs('img/kolozha-1915.webp', CMP_SIZES)} alt="${esc(tr(DOCS['d-kolozha'].t))}" loading="lazy" decoding="async">
          <span class="compare__tag compare__tag--left">${esc(p.cmpL)}</span>
          <span class="compare__tag compare__tag--right">${esc(p.cmpR)}</span>
          <span class="compare__line" aria-hidden="true"></span>
          <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="${esc(p.cmpH)}">
        </div>
      </section>

      <div class="home-section">
        <div class="home-duo">
          <section class="card" id="dayq">
            <h2 class="eyebrow">${esc(p.dayH)}</h2>
            <h3 class="card__title">${esc(tr(day.q))}</h3>
            <div class="options">${optionsHtml(tr(day.o))}</div>
            <p class="explain" hidden>${esc(tr(day.e))}</p>
            <a class="card__more" href="#quiz">${esc(p.dayMore)} <span aria-hidden="true">→</span></a>
          </section>
          <section class="card card--center">
            <h2 class="eyebrow">${esc(p.candleH)}</h2>
            <div class="candle" id="candle" aria-hidden="true">
              <div class="candle__flame"></div>
              <div class="candle__wax"></div>
            </div>
            <p>${esc(p.candleP)}</p>
            <button class="button button--primary candle-btn" type="button" id="candle-btn">${esc(p.candleBtn)}</button>
            <p class="caption" id="candle-n">${esc(p.candleN(progress.candles))}</p>
          </section>
        </div>
      </div>
    </div>
  `;

  /* «Отправиться в путь» прокручивает к пяти главам (и при повторном нажатии тоже) */
  $('#open-go').addEventListener('click', (e) => {
    e.preventDefault();
    goTo('home', 'chapters');
  });

  /* подпись на снимке открывает карточку открытки 1915 года */
  $('#open-credit').addEventListener('click', () => openDoc('d-kolozha'));

  /* цитата ведёт к разбору документа в архиве */
  $('#quote-doc').addEventListener('click', () => goTo('archive', 'letter'));

  /* вопрос дня: один ответ, затем пояснение */
  const dayBox = $('#dayq');
  $$('.option', dayBox).forEach((option) =>
    option.addEventListener('click', () => {
      const picked = Number(option.dataset.k);
      markAnswer(dayBox, picked, day.a);
      $('.explain', dayBox).hidden = false;
      if (picked === day.a) playBell(659.25, 0.04);
    })
  );

  /* свеча: счётчик хранится только на этом устройстве */
  $('#candle-btn').addEventListener('click', () => {
    initSound();
    progress.candles++;
    store.set('candles', progress.candles);
    $('#candle').classList.add('candle--lit');
    $('#candle-btn').textContent = p.candleLit;
    $('#candle-n').textContent = p.candleN(progress.candles);
    playBell(392, 0.04);
  });

  /* ползунок «Было — стало» двигает границу между снимками */
  const compare = $('#cmp');
  $('.compare__range', compare).addEventListener('input', (e) => {
    compare.style.setProperty('--p', e.target.value + '%');
  });
}
