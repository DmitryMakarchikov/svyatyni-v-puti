'use strict';

/* Игра «Дорога 1915»: карточки с выбором влево/вправо, три шкалы и три концовки.
   Фазы: intro → card (выбор) → res (итог хода) → … → end. Если шкала упала до нуля,
   вставляется фаза rescue: герою помогают незнакомые люди, проиграть нельзя. */

/* шкалы: максимум, ключи и значки (цвет задаётся в CSS через meter--s/b/n) */
const METER_MAX = 10;
/* ширина снимка на карточке хода: карточка до 460px минус поля */
const CARD_SIZES = '(max-width: 500px) calc(100vw - 66px), 434px';
const METER_KEYS = ['s', 'b', 'n'];
const METER_ICONS = {
  s: '<svg class="meter__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="M11 21l2-6 3 3v3M9 12l2-4 4 2 2 3M7 21l3-7"/></svg>',
  b: '<svg class="meter__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12c0-4 3.6-6 8-6s8 2 8 6v6H4z"/><path d="M8 9l1 3M12 8v4M16 9l-1 3"/></svg>',
  n: '<svg class="meter__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c2 3 2 5 0 6-2-1-2-3 0-6z"/><rect x="9" y="10" width="6" height="11"/></svg>'
};
/* документы, которые можно найти в игре, и максимум милосердия за партию */
const GAME_DOCS = [...new Set(CARDS.map((card) => card.doc).filter(Boolean))];
const MERCY_MAX = CARDS.reduce((sum, card) => sum + Math.max(card.L.fx.m || 0, card.R.fx.m || 0), 0);

/* состояние партии */
const game = {
  phase: 'intro',
  step: -1 /* -1 — пролог */,
  s: 6,
  b: 6,
  n: 6,
  mercy: 0,
  helped: 0,
  pending: null /* шкала, упавшая до нуля */,
  rescueKey: null,
  lastResult: null,
  ending: 0,
  busy: false /* идёт анимация улёта карточки */
};

/* текущая карточка (пролог или ход) */
const currentCard = () => (game.step < 0 ? PRO : CARDS[game.step]);

/* рисует игровой экран: шкалы, карточку и кнопки выбора */
function renderGame() {
  if (game.phase === 'intro') return renderGameIntro();
  if (game.phase === 'end') return renderGameEnd();

  const g = gameTexts();
  const meters = METER_KEYS.map(
    (key) => `
      <div class="meter meter--${key}" data-k="${key}" role="meter" aria-valuemin="0" aria-valuemax="${METER_MAX}" aria-valuenow="${game[key]}" aria-label="${esc(g.meters[key])}">
        <span class="meter__dot"></span>
        ${METER_ICONS[key]}
        <span>${esc(g.meters[key])}</span>
        <span class="meter__bar">
          <span class="meter__fill" style="width: ${(game[key] / METER_MAX) * 100}%"></span>
        </span>
      </div>`
  ).join('');

  $('#v-game').innerHTML = `
    <div class="container container--stage">
      <h2 class="visually-hidden" id="t-game">${esc(g.title)}</h2>
      <div class="game">
        <div class="game__meters">${meters}</div>
        <div class="game__meta">
          <span id="g-date"></span>
          <span id="g-step"></span>
        </div>
        <div class="deck">
          <div class="deck__back" aria-hidden="true"></div>
          <article class="postcard" id="gcard" aria-live="polite"></article>
        </div>
        <div class="game__actions">
          <div class="game__choices" id="choices">
            <button class="choice" type="button" id="ch-l">
              <span class="choice__arrow" aria-hidden="true">←</span>
              <span id="ch-l-t"></span>
            </button>
            <button class="choice choice--right" type="button" id="ch-r">
              <span id="ch-r-t"></span>
              <span class="choice__arrow" aria-hidden="true">→</span>
            </button>
          </div>
          <button class="button button--primary game__next" type="button" id="g-nx" hidden>
            ${esc(g.next)} <span class="button__arrow" aria-hidden="true">→</span>
          </button>
        </div>
        <p class="game__tip" id="g-tip">${esc(g.tip)}</p>
      </div>
    </div>
  `;

  [
    ['ch-l', 'L'],
    ['ch-r', 'R']
  ].forEach(([id, side]) => {
    const button = $('#' + id);
    const preview = () => {
      if (game.phase === 'card' && game.step >= 0) showDots(currentCard()[side].fx);
    };
    button.addEventListener('click', () => choose(side));
    /* при наведении точки над шкалами подсказывают, что изменится */
    button.addEventListener('pointerenter', preview);
    button.addEventListener('focus', preview);
    button.addEventListener('pointerleave', () => showDots(null));
    button.addEventListener('blur', () => showDots(null));
  });
  $('#g-nx').addEventListener('click', nextStep);
  bindSwipe();

  /* перерисовка (например, после смены языка) возвращает ту же фазу */
  if (game.phase === 'card') drawCard();
  else if (game.phase === 'res' && game.lastResult) drawResult(game.lastResult, true);
  else if (game.phase === 'rescue') drawRescue(game.rescueKey);
}

/* экран перед началом игры */
function renderGameIntro() {
  const g = gameTexts();
  $('#v-game').innerHTML =
    pageHead('game', g.title) +
    `
    <div class="container">
      <div class="game-intro">
        <div class="game-intro__text">
          <p class="lead">${esc(g.lead)}</p>
          <p class="caption">${esc(g.note)}</p>
          <div class="actions">
            <button class="button button--primary" type="button" id="g-start">
              ${esc(g.start)} <span class="button__arrow" aria-hidden="true">→</span>
            </button>
            <a class="button" href="#archive">${esc(g.toArchive)}</a>
          </div>
        </div>
        <img class="game-intro__img" ${imgAttrs('img/kolozha-1915.jpg', '(max-width: 900px) calc(100vw - 40px), 574px')} alt="" fetchpriority="high">
      </div>
    </div>
  `;

  $('#g-start').addEventListener('click', () => {
    initSound();
    Object.assign(game, {
      phase: 'card',
      step: -1,
      s: 6,
      b: 6,
      n: 6,
      mercy: 0,
      helped: 0,
      pending: null,
      lastResult: null
    });
    renderGame();
  });
}

/* Шкалы и подсказки */
function paintMeters() {
  METER_KEYS.forEach((key) => {
    const meter = $(`.meter[data-k="${key}"]`);
    if (!meter) return;
    $('.meter__fill', meter).style.width = (game[key] / METER_MAX) * 100 + '%';
    meter.setAttribute('aria-valuenow', String(game[key]));
    meter.classList.toggle('meter--low', game[key] <= 2);
  });
}

/* точки над шкалами: какие шкалы изменит выбор */
function showDots(fx) {
  METER_KEYS.forEach((key) => {
    const dot = $(`.meter[data-k="${key}"] .meter__dot`);
    if (!dot) return;
    const value = fx ? fx[key] || 0 : 0;
    dot.classList.toggle('meter__dot--on', value !== 0);
    dot.classList.toggle('meter__dot--big', Math.abs(value) >= 2);
  });
}

/* Всплывающее «+1 / −1» под шкалой */
function showChange(key, value) {
  const meter = $(`.meter[data-k="${key}"]`);
  if (!meter) return;
  const chip = createEl('span', 'meter__chip ' + (value > 0 ? 'meter__chip--up' : 'meter__chip--down'));
  chip.textContent = (value > 0 ? '+' : '−') + Math.abs(value);
  meter.append(chip);
  setTimeout(() => chip.remove(), 1500);
}

/* Карточка хода */
function postcardPhoto(card, alt = '') {
  return `
    <div class="postcard__photo">
      <img class="postcard__img" ${imgAttrs(card.img, CARD_SIZES)} alt="${esc(alt)}" draggable="false" style="object-position: ${card.pos}">
      <div class="postcard__hint"></div>
      <div class="postcard__stamp">${esc(tr(card.date))}</div>
    </div>
  `;
}

/* показывает карточку хода с вопросом */
function drawCard() {
  const card = currentCard();
  const box = $('#gcard');
  const isPrologue = game.step < 0;

  $('#g-date').textContent = tr(card.date);
  $('#g-step').textContent = isPrologue ? '' : `${game.step + 1} / ${CARDS.length}`;
  box.innerHTML = `
    ${postcardPhoto(card, tr(card.who))}
    <div class="postcard__text">
      <p class="eyebrow">${esc(tr(card.who))}</p>
      <p class="postcard__say">${esc(tr(card.say))}</p>
    </div>
  `;
  box.classList.remove('postcard--result');

  $('#choices').hidden = isPrologue;
  $('#g-nx').hidden = !isPrologue;
  $('#g-tip').style.visibility = isPrologue ? 'hidden' : 'visible';
  if (!isPrologue) {
    $('#ch-l-t').textContent = tr(card.L.t);
    $('#ch-r-t').textContent = tr(card.R.t);
  }

  /* заранее грузим картинку следующего хода, чтобы не было задержки */
  const next = CARDS[game.step + 1];
  if (next) Object.assign(new Image(), { sizes: CARD_SIZES, srcset: srcsetOf(next.img), src: next.img });

  showDots(null);
  if (!reducedMotion) box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
}

/* выбор игрока: 'L' — влево, 'R' — вправо */
function choose(side) {
  if (game.phase !== 'card' || game.step < 0) return;
  const card = currentCard();
  const option = side === 'L' ? card.L : card.R;
  const box = $('#gcard');
  const dir = side === 'L' ? -1 : 1;

  game.phase = 'res';
  game.busy = true;
  initSound();
  playSwish();

  /* карточка улетает в сторону выбора */
  const done = () => {
    box.style.transform = '';
    game.busy = false;
    applyChoice(card, option);
  };
  if (reducedMotion) return done();
  const fly = box.animate(
    [
      { transform: box.style.transform || 'none' },
      { transform: `translateX(${dir * 120}%) rotate(${dir * 14}deg)`, opacity: 0 }
    ],
    { duration: 280, easing: 'ease-in', fill: 'forwards' }
  );
  fly.onfinish = () => {
    done();
    fly.cancel();
  };
}

/* меняет шкалы и сохраняет найденный документ */
function applyChoice(card, option) {
  const deltas = [];
  METER_KEYS.forEach((key) => {
    const change = option.fx[key];
    if (!change) return;
    game[key] = Math.max(0, Math.min(METER_MAX, game[key] + change));
    deltas.push([key, change]);
    showChange(key, change);
  });
  game.mercy += option.fx.m || 0;
  paintMeters();
  showDots(null);

  const empty = METER_KEYS.find((key) => game[key] <= 0);
  if (empty) game.pending = empty;

  /* документ хода попадает в архив с отметкой «Найдено в игре» */
  const isNewDoc = card.doc && remember('found', card.doc);
  game.lastResult = { card, option, deltas };
  drawResult(game.lastResult);
  if (isNewDoc) setTimeout(() => playBell(659.25, 0.045), 250);
}

/* quiet — перерисовка без анимации и без переноса фокуса */
function drawResult(result, quiet = false) {
  const g = gameTexts();
  const box = $('#gcard');
  const { card, option, deltas } = result;

  const changes = deltas.length
    ? `<div class="deltas">${deltas
        .map(([key, value]) => {
          const mod = value > 0 ? 'up' : 'down';
          const sign = value > 0 ? '+' : '−';
          return `<span class="deltas__item deltas__item--${mod}">${esc(g.meters[key])} ${sign}${Math.abs(value)}</span>`;
        })
        .join('')}</div>`
    : '';

  const doc = card.doc ? DOCS[card.doc] : null;
  const found = doc
    ? `
      <button class="found-doc" type="button" id="g-doc">
        <img class="found-doc__img" src="${thumb(doc.img)}" alt="">
        <span>
          <span class="eyebrow">${esc(g.newDoc)}</span>
          <span class="found-doc__title">${esc(tr(doc.t))}</span>
        </span>
      </button>`
    : '';

  box.innerHTML = `
    ${postcardPhoto(card)}
    <div class="postcard__text">
      <p class="eyebrow">${esc(tr(option.t))}</p>
      <p class="postcard__say">${esc(tr(option.r))}</p>
      ${changes}
      ${found}
    </div>
  `;
  box.classList.add('postcard--result');
  if (doc) $('#g-doc').addEventListener('click', () => openDoc(card.doc));
  if (!reducedMotion && !quiet)
    box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });

  $('#choices').hidden = true;
  $('#g-tip').style.visibility = 'hidden';
  $('#g-nx').hidden = false;
  if (!quiet) $('#g-nx').focus({ preventScroll: true });
}

/* кнопка «Дальше»: следующий ход, помощь или финал */
function nextStep() {
  if (game.busy) return;
  initSound();

  if (game.phase === 'rescue') {
    game.phase = 'card';
    game.step++;
    if (game.step >= CARDS.length) return finishGame();
    playSwish();
    return drawCard();
  }
  if (game.phase === 'card' && game.step < 0) {
    game.step = 0;
    playSwish();
    return drawCard();
  }
  if (game.phase !== 'res') return;

  /* шкала на нуле — сначала помощь, потом следующий ход */
  if (game.pending) {
    const key = game.pending;
    game.pending = null;
    game.phase = 'rescue';
    game.rescueKey = key;
    game[key] = 3;
    game.helped++;
    paintMeters();
    showChange(key, 3);
    return drawRescue(key);
  }

  game.step++;
  game.phase = 'card';
  if (game.step >= CARDS.length) return finishGame();
  playSwish();
  drawCard();
}

/* карточка помощи, когда шкала упала до нуля */
function drawRescue(key) {
  const g = gameTexts();
  const box = $('#gcard');
  box.innerHTML = `
    ${postcardPhoto(currentCard())}
    <div class="postcard__text">
      <p class="eyebrow">${esc(g.rescueWho)}</p>
      <p class="postcard__say">${esc(g.rescue[key])}</p>
      <div class="deltas">
        <span class="deltas__item deltas__item--up">${esc(g.meters[key])} +3</span>
      </div>
    </div>
  `;
  box.classList.add('postcard--result');
  $('#choices').hidden = true;
  $('#g-tip').style.visibility = 'hidden';
  $('#g-nx').hidden = false;
}

/* Свайп: карточку тянут пальцем или мышью, после 90px выбор засчитывается */
function bindSwipe() {
  const box = $('#gcard');
  let drag = null;

  box.addEventListener('pointerdown', (e) => {
    if (game.phase !== 'card' || game.step < 0) return;
    drag = { startX: e.clientX, dx: 0 };
    box.setPointerCapture(e.pointerId);
  });

  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.startX;
    box.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 22}deg)`;

    const side = drag.dx < 0 ? 'L' : 'R';
    const hint = $('.postcard__hint', box);
    if (hint) {
      const label = tr(currentCard()[side].t);
      hint.textContent = side === 'L' ? '← ' + label : label + ' →';
      hint.style.textAlign = side === 'L' ? 'left' : 'right';
      hint.style.opacity = Math.min(1, Math.abs(drag.dx) / 90);
    }
    showDots(Math.abs(drag.dx) > 20 ? currentCard()[side].fx : null);
  });

  const release = () => {
    if (!drag) return;
    const dx = drag.dx;
    drag = null;
    if (Math.abs(dx) > 90) return choose(dx < 0 ? 'L' : 'R');
    /* не дотянули — карточка возвращается на место */
    box.style.transform = '';
    const hint = $('.postcard__hint', box);
    if (hint) hint.style.opacity = 0;
    showDots(null);
  };
  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);
}

/* Стрелки ← → на клавиатуре (вызывается из main.js) */
function handleGameKeys(e) {
  if (game.phase !== 'card' || game.step < 0 || e.target.closest('input')) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    choose('L');
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    choose('R');
  }
}

/* Концовка зависит от скрытого счётчика милосердия */
function finishGame() {
  game.ending = ENDINGS.findIndex((ending) => game.mercy >= ending.min);
  game.phase = 'end';
  remember('endings', game.ending);
  playBell(392, 0.06);
  setTimeout(() => playBell(523.25, 0.05), 220);
  renderGameEnd();
  window.scrollTo(0, 0);
}

/* экран итога: концовка и статистика */
function renderGameEnd() {
  const g = gameTexts();
  const ending = ENDINGS[game.ending];
  const found = GAME_DOCS.filter((id) => progress.found.includes(id)).length;
  const stats = [
    [`${game.mercy}/${MERCY_MAX}`, g.good],
    [String(game.helped), g.helped],
    [`${progress.endings.length}/3`, g.ends],
    [`${found}/${GAME_DOCS.length}`, g.docs]
  ];

  $('#v-game').innerHTML = `
    <div class="container container--end">
      <div class="game-end">
        <div>
          <p class="eyebrow">${esc(g.endLab)} · ${game.ending + 1}/3</p>
          <h2 class="game-end__title" id="t-game">${esc(tr(ending.t))}</h2>
          <p class="game-end__text">${esc(tr(ending.x))}</p>
          <div class="actions game-end__actions">
            <button class="button button--primary" type="button" id="g-again">${esc(g.again)}</button>
            <a class="button" href="#archive">${esc(g.toArchive)}</a>
            <a class="button" href="#shrines">${esc(ui().nav.shrines)}</a>
          </div>
        </div>
        <ul class="game-stats">
          ${stats
            .map(
              ([value, label]) => `
                <li class="game-stats__item">
                  <strong class="game-stats__value">${esc(value)}</strong>
                  <span class="game-stats__label">${esc(label)}</span>
                </li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
  `;

  $('#g-again').addEventListener('click', () => {
    game.phase = 'intro';
    renderGame();
  });
}
