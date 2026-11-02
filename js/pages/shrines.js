'use strict';

/* Святыни: четыре иконы и их досье «до войны — в войну — сегодня» */

/* рисует карточки икон */
function renderShrines() {
  const p = texts();
  $('#v-shrines').innerHTML =
    pageHead('shrines', p.shLab, p.shH, p.shLead) +
    `
    <div class="container">
      <ul class="shrines" id="shr"></ul>
    </div>
  `;

  const periods = ['before', 'war', 'now'].map((key) => esc(tr(SH_LABELS[key]))).join(' · ');

  SHRINES.forEach((shrine, i) => {
    const picture = shrine.img
      ? `<img class="shrine__img" src="${shrine.img}" alt="" loading="lazy" style="object-position: ${shrine.pos}">`
      : `<span class="shrine__placeholder" aria-hidden="true">${esc(tr(shrine.t))}</span>`;

    const button = createEl('button', 'shrine');
    button.type = 'button';
    button.innerHTML = `
      ${picture}
      <span class="shrine__body">
        <span class="status status--${shrine.st}">${esc(tr(shrine.s))}</span>
        <span class="shrine__title">${esc(tr(shrine.t))}</span>
        <span class="caption shrine__meta">${periods}</span>
      </span>
    `;
    button.addEventListener('click', () => openShrine(shrine, i));

    const item = createEl('li', 'shrines__item');
    item.append(button);
    $('#shr').append(item);
  });
}

/* открывает досье иконы */
function openShrine(shrine, i) {
  /* печать, когда прочитаны все досье */
  if (remember('shrines', i) && progress.shrines.length >= SHRINES.length) addStamp('shrines');

  const dossier = ['before', 'war', 'now']
    .map(
      (key) => `
        <div>
          <dt class="dossier__term">${esc(tr(SH_LABELS[key]))}</dt>
          <dd class="dossier__desc">${esc(tr(shrine[key]))}</dd>
        </div>`
    )
    .join('');

  openModal(
    `
    ${shrine.img ? `<img class="modal__img" src="${shrine.img}" alt="${esc(tr(shrine.t))}">` : ''}
    <div>
      <span class="status status--${shrine.st}">${esc(tr(shrine.s))}</span>
      <h3 class="modal__title" id="m-title">${esc(tr(shrine.t))}</h3>
      <dl class="dossier">${dossier}</dl>
      <p class="modal__source">${esc(tr(SH_LABELS.src))}: ${esc(tr(shrine.src))}</p>
    </div>
  `,
    !shrine.img
  );
}
