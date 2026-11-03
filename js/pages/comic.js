'use strict';

/* Сказание «Чудо под Августовом»: картины-кадры в сетке и просмотр по одной */

const viewer = $('#viewer');
/* номер кадра, открытого в просмотре */
let frameIndex = 0;

/* ширина кадра на экране (6 колонок, промежуток 14px) — по ней выбирается размер снимка */
function frameSizes(w) {
  const wide = 185 * w + 14 * (w - 1);
  return `(max-width: 900px) calc(100vw - 40px), (max-width: 1220px) calc((100vw - 110px) / 6 * ${w} + ${(w - 1) * 14}px), ${wide}px`;
}

/* рисует сетку кадров */
function renderComic() {
  const p = texts();
  const readButton = `
    <div class="actions">
      <button class="button button--primary" type="button" id="co-read">
        ${esc(p.coRead)} <span class="button__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  `;

  $('#v-comic').innerHTML =
    pageHead('comic', p.coH, p.coLead, readButton) +
    `
    <div class="container">
      <ol class="comic" id="comic-grid"></ol>
    </div>
  `;

  const grid = $('#comic-grid');
  COMIC.forEach((frame, i) => {
    const button = createEl('button', 'frame' + (frame.txt ? ' frame--text' : ''));
    button.type = 'button';
    button.setAttribute('aria-label', `${i + 1}: ${tr(frame.cap)}`);

    if (frame.txt) {
      button.innerHTML = `
        <span class="frame__big">${esc(frame.txt)}</span>
        <span class="frame__text">${esc(tr(frame.cap))}</span>
      `;
    } else {
      button.innerHTML = `
        <img class="frame__img" ${imgAttrs(frame.img, frameSizes(frame.w))} alt="" ${i ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'} style="object-position: ${frame.pos}">
        <span class="frame__caption${frame.bot ? ' frame__caption--bottom' : ''}">${esc(tr(frame.cap))}</span>
        ${frame.bub ? `<span class="frame__bubble">${esc(tr(frame.bub))}</span>` : ''}
      `;
    }
    button.insertAdjacentHTML('beforeend', `<span class="frame__num" aria-hidden="true">${i + 1}</span>`);
    button.addEventListener('click', () => openViewer(i));

    const cell = createEl('li', `comic__cell comic__cell--w${frame.w}`);
    cell.append(button);
    grid.append(cell);
  });

  $('#co-read').addEventListener('click', () => openViewer(0));

  /* печать, когда читатель долистал до последнего кадра */
  const last = grid.lastElementChild;
  if ('IntersectionObserver' in window && last) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        addStamp('comic');
        observer.disconnect();
      },
      { threshold: 0.6 }
    );
    observer.observe(last);
  }
}

/* открывает просмотр с кадра i */
function openViewer(i) {
  frameIndex = i;
  showDialog(viewer);
  paintViewer();
  ($('#v-next').disabled ? $('#v-close') : $('#v-next')).focus();
}

/* показывает текущий кадр и обновляет кнопки */
function paintViewer() {
  const frame = COMIC[frameIndex];
  const stage = $('#vp');
  const isLast = frameIndex === COMIC.length - 1;

  stage.className = 'viewer__stage' + (frame.txt ? ' viewer__stage--text' : '');
  if (frame.txt) {
    stage.innerHTML = `
      <span class="viewer__big">${esc(frame.txt)}</span>
      <p class="viewer__text">${esc(tr(frame.cap))}</p>
    `;
  } else {
    const bubble = frame.bub ? ` — «${esc(tr(frame.bub))}»` : '';
    stage.innerHTML = `
      <img class="viewer__img" src="${frame.img}" alt="" style="object-position: ${frame.pos}">
      <p class="viewer__caption">${esc(tr(frame.cap))}${bubble}</p>
    `;
  }

  $('#v-n').textContent = `${frameIndex + 1} / ${COMIC.length}`;
  $('#v-prev').disabled = frameIndex === 0;
  $('#v-next').disabled = isLast;
  if (isLast) addStamp('comic');

  if (!reducedMotion) {
    stage.animate(
      [
        { opacity: 0, transform: 'scale(.98)' },
        { opacity: 1, transform: 'none' }
      ],
      { duration: 260 }
    );
  }
}

/* step: -1 — назад, 1 — вперёд */
function stepViewer(step) {
  const next = frameIndex + step;
  if (next < 0 || next >= COMIC.length) return;
  frameIndex = next;
  initSound();
  playSwish();
  paintViewer();
  /* на крайнем кадре кнопка выключается — фокус переносим, чтобы он не потерялся */
  if (document.activeElement && document.activeElement.disabled) $('#v-close').focus();
}

$('#v-prev').addEventListener('click', () => stepViewer(-1));
$('#v-next').addEventListener('click', () => stepViewer(1));
$('#v-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', restoreFocus);
