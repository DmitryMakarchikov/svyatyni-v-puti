'use strict';

/* Главная: заголовок, «икона с клеймами» (разделы вокруг иконы), путь святынь,
   вопрос дня, свеча памяти и «Было — стало» */

/* рисует главную страницу */
function renderHome() {
  const p = texts();
  /* вопрос дня меняется раз в сутки */
  const day = QUIZ[Math.floor(Date.now() / 864e5) % QUIZ.length];

  /* клейма: разделы сайта по сторонам иконы, как сцены жития вокруг образа */
  const kleyma = p.kleyma
    .map(
      ([route, img, title, text], i) => `
        <a class="kleymo kleymo--${i + 1}" href="#${route}">
          <img class="kleymo__img" src="${thumb(img)}" alt="" loading="lazy">
          <span class="kleymo__body">
            <span class="kleymo__num" aria-hidden="true">${i + 1}</span>
            <span class="kleymo__title">${esc(title)}</span>
            <span class="kleymo__text">${esc(text)}</span>
          </span>
        </a>`
    )
    .join('');

  /* путь святынь: главные годы на пунктирной дороге */
  const path = p.path
    .map(
      ([year, text]) => `
        <li class="milestones__item">
          <span class="milestones__year">${esc(year)}</span>
          <span class="milestones__text">${esc(text)}</span>
        </li>`
    )
    .join('');

  $('#v-home').innerHTML = `
    <div class="container">
      <header class="home-head">
        <p class="eyebrow">${esc(p.homeLab)}</p>
        <h1 class="home-head__title" id="t-home">${esc(p.homeTitle)}</h1>
        <span class="ornament" aria-hidden="true"></span>
        <p class="lead home-head__lead">${esc(p.homeLead)}</p>
        <div class="actions home-head__actions">
          <a class="button button--primary" href="#chronicle">
            ${esc(p.homeGo)} <span class="button__arrow" aria-hidden="true">→</span>
          </a>
          <a class="button" href="#game">${esc(p.homePlay)}</a>
        </div>
      </header>

      <nav class="icon-board" aria-label="${esc(p.kleymaLabel)}">
        <figure class="icon-board__center">
          <img class="icon-board__img" src="img/icon-augustow.jpg" fetchpriority="high" alt="${esc(tr(DOCS['d-icon'].t))}" width="800" height="1006">
        </figure>
        ${kleyma}
      </nav>
      <p class="caption icon-board__caption">${esc(p.heroCap)}</p>

      <section class="home-section" aria-labelledby="h-path">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-path">${esc(p.pathH)}</h2>
        </div>
        <ol class="milestones">${path}</ol>
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
