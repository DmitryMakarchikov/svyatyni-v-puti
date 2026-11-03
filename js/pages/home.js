'use strict';

/* Главная: первый экран-история на «ночном небе», плитки разделов,
   путь святынь, голос 1915 года, вопрос дня, свеча памяти и «Было — стало» */

/* ширина «Было — стало»: во всю ширину контейнера */
const CMP_SIZES = '(max-width: 1220px) calc(100vw - 40px), 1180px';

/* рисует главную страницу */
function renderHome() {
  const p = texts();
  /* вопрос дня меняется раз в сутки */
  const day = QUIZ[Math.floor(Date.now() / 864e5) % QUIZ.length];

  /* печати на первом экране: золотые — уже полученные */
  const seals = STAMP_KEYS.map(
    (key, i) => `<span class="seals__dot${progress.stamps[key] ? ' seals__dot--on' : ''}">${i + 1}</span>`
  ).join('');

  /* плитки разделов: фото, затемнение и подпись поверх; у пройденных — отметка печати */
  const tiles = p.kleyma
    .map(
      ([route, img, title, text]) => `
        <a class="bento__tile bento__tile--${route}" href="#${route}">
          <img class="bento__img" src="${thumb(img)}" alt="" loading="lazy" decoding="async">
          <span class="bento__body">
            ${progress.stamps[route] ? `<span class="bento__stamp">${esc(ui().stampsShort)} ✓</span>` : ''}
            <span class="bento__title">${esc(title)}</span>
            <span class="bento__text">${esc(text)}</span>
          </span>
        </a>`
    )
    .join('');

  /* путь святынь: год, событие и пояснение на пунктирной дороге */
  const path = p.path
    .map(
      ([year, title, text]) => `
        <li class="milestones__item">
          <span class="milestones__year">${esc(year)}</span>
          <span class="milestones__body">
            <strong class="milestones__name">${esc(title)}</strong>
            <span class="milestones__text">${esc(text)}</span>
          </span>
        </li>`
    )
    .join('');

  $('#v-home').innerHTML = `
    <header class="hero">
      <div class="container hero__inner">
        <div class="hero__text">
          <p class="hero__eyebrow">${esc(p.homeLab)}</p>
          <h1 class="hero__title" id="t-home">${esc(p.homeTitle)}</h1>
          <span class="ornament ornament--dark" aria-hidden="true"></span>
          <p class="hero__hook">${esc(p.homeHook)}</p>
          <div class="actions">
            <a class="button button--gold" href="#chronicle">
              ${esc(p.homeGo)} <span class="button__arrow" aria-hidden="true">→</span>
            </a>
            <a class="button button--ghost" href="#game">${esc(p.homePlay)}</a>
          </div>
          <button class="seals" type="button" id="hero-seals">
            <span class="seals__row" aria-hidden="true">${seals}</span>
            <span class="seals__text">${esc(p.sealsText(countStamps()))}</span>
          </button>
        </div>
        <div class="hero__collage" aria-hidden="true">
          <img class="hero__doc hero__doc--postcard" src="img/thumbs/kolozha-1915.jpg" alt="" fetchpriority="high">
          <img class="hero__doc hero__doc--magazine" src="img/thumbs/niva-1914.jpg" alt="">
          <img class="hero__doc hero__doc--poster" src="img/thumbs/poster-1915.jpg" alt="">
          <span class="hero__stamp">${esc(p.stampPlace)}<b>1 (14) IX 1914</b></span>
        </div>
      </div>
    </header>

    <div class="container">
      <section class="home-section" aria-labelledby="h-kleyma">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-kleyma">${esc(p.kleymaH)}</h2>
          <p class="caption">${esc(p.kleymaCap)}</p>
        </div>
        <nav class="bento" aria-label="${esc(p.kleymaLabel)}">${tiles}</nav>
      </section>

      <section class="home-section" aria-labelledby="h-path">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-path">${esc(p.pathH)}</h2>
        </div>
        <ol class="milestones">${path}</ol>
      </section>

      <section class="home-section" aria-labelledby="h-quote">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-quote">${esc(p.quoteH)}</h2>
        </div>
        <div class="quote">
          <img class="quote__img" src="${thumb(DOCS['d-gev'].img)}" alt="${esc(tr(DOCS['d-gev'].t))}" loading="lazy" decoding="async">
          <div class="quote__body">
            <figure class="quote__figure">
              <blockquote class="quote__text">«${esc(p.quote)}»</blockquote>
              <figcaption class="caption">${esc(p.quoteSrc)}${p.quoteNote ? ' ' + esc(p.quoteNote) : ''}</figcaption>
            </figure>
            <button class="button button--small" type="button" id="quote-doc">${esc(p.quoteBtn)}</button>
          </div>
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

      <section class="home-section" aria-labelledby="h-compare">
        <div class="home-section__head">
          <h2 class="home-section__title" id="h-compare">${esc(p.cmpH)}</h2>
        </div>
        <div class="compare" id="cmp" style="--p: 50%">
          <img class="compare__img" ${imgAttrs('img/kolozha-today.jpg', CMP_SIZES)} alt="${esc(tr(DOCS['d-kolozha-today'].t))}" loading="lazy" decoding="async">
          <img class="compare__img compare__img--top" ${imgAttrs('img/kolozha-1915.jpg', CMP_SIZES)} alt="${esc(tr(DOCS['d-kolozha'].t))}" loading="lazy" decoding="async">
          <span class="compare__tag compare__tag--left">${esc(p.cmpL)}</span>
          <span class="compare__tag compare__tag--right">${esc(p.cmpR)}</span>
          <span class="compare__line" aria-hidden="true"></span>
          <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="${esc(p.cmpH)}">
        </div>
        <p class="caption home-section__caption">${esc(p.cmpCap)}</p>
      </section>
    </div>
  `;

  /* печати на первом экране открывают «Путевой лист» */
  $('#hero-seals').addEventListener('click', () => $('#pass-btn').click());

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
