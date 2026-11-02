'use strict';

/* Главная: обложка, цифры, плитки разделов, вопрос дня, свеча памяти и «Было — стало» */

/* рисует главную страницу */
function renderHome() {
  const p = texts();
  /* вопрос дня меняется раз в сутки */
  const day = QUIZ[Math.floor(Date.now() / 864e5) % QUIZ.length];

  const stats = p.counters
    .map(
      ([value, label]) => `
        <li class="stats__item">
          <strong class="stats__value">${esc(value)}</strong>
          <span class="stats__label">${esc(label)}</span>
        </li>`
    )
    .join('');

  const tiles = p.tiles
    .map(
      ([route, img, title, text], i) => `
        <li class="tiles__item">
          <a class="tile" href="#${route}">
            <img class="tile__img" src="${img}" alt="" loading="lazy">
            <span class="tile__body">
              <span class="eyebrow">${String(i + 1).padStart(2, '0')}</span>
              <span class="tile__title">${esc(title)}</span>
              <span class="tile__text">${esc(text)}</span>
            </span>
          </a>
        </li>`
    )
    .join('');

  $('#v-home').innerHTML = `
    <div class="container">
      <div class="hero">
        <div>
          <p class="eyebrow">${esc(p.homeLab)}</p>
          <h1 class="hero__title" id="t-home">
            ${esc(p.homeH1a)} <span class="hero__accent">${esc(p.homeH1b)}</span>
          </h1>
          <p class="lead hero__lead">${esc(p.homeLead)}</p>
          <div class="actions">
            <a class="button button--primary" href="#chronicle">
              ${esc(p.homeGo)} <span class="button__arrow" aria-hidden="true">→</span>
            </a>
            <a class="button" href="#game">${esc(p.homePlay)}</a>
          </div>
        </div>
        <figure class="hero__figure">
          <div class="hero__frame">
            <img class="hero__img" src="img/icon-augustow.jpg" alt="${esc(tr(DOCS['d-icon'].t))}" width="800" height="1006">
          </div>
          <figcaption class="caption hero__caption">${esc(p.heroCap)}</figcaption>
        </figure>
      </div>

      <ul class="stats">${stats}</ul>

      <section class="home-section" aria-labelledby="h-start">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-start">${esc(p.startH)}</h2>
        </div>
        <ul class="tiles">${tiles}</ul>
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

      <section class="home-section" aria-labelledby="h-compare">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-compare">${esc(p.cmpH)}</h2>
        </div>
        <div class="compare" id="cmp" style="--p: 50%">
          <img class="compare__img" src="img/kolozha-today.jpg" alt="${esc(tr(DOCS['d-kolozha-today'].t))}" loading="lazy">
          <img class="compare__img compare__img--top" src="img/kolozha-1915.jpg" alt="${esc(tr(DOCS['d-kolozha'].t))}" loading="lazy">
          <span class="compare__tag compare__tag--left">${esc(p.cmpL)}</span>
          <span class="compare__tag compare__tag--right">${esc(p.cmpR)}</span>
          <span class="compare__line" aria-hidden="true"></span>
          <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="${esc(p.cmpH)}">
        </div>
        <p class="caption home-section__caption">${esc(p.cmpCap)}</p>
      </section>
    </div>
  `;

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
