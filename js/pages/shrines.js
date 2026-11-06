'use strict';

/* Святыни: четыре иконы и их досье «до войны — в войну — сегодня» */

/* рисует карточки икон */
function renderShrines() {
  const p = texts();
  /* инфографика: сколько святынь сохранилось, утрачено и с неясной судьбой */
  const fates = ['ok', 'lost', 'unknown'].map((st) => [st, SHRINES.filter((s) => s.st === st).length]);
  const fatesText = fates.map(([st, n]) => `${tr(SH_FATES[st])} — ${n}`).join(', ');

  $('#v-shrines').innerHTML =
    pageHead('shrines', p.shH, p.shLead) +
    `
    <div class="container">
      <div class="fates" role="img" aria-label="${esc(tr(SH_FATES.title))}: ${esc(fatesText)}">
        <p class="eyebrow">${esc(tr(SH_FATES.title))}</p>
        <div class="fates__bar" aria-hidden="true">
          ${SHRINES.map((s) => `<span class="fates__part fates__part--${s.st}">${esc(tr(s.t))}</span>`).join('')}
        </div>
        <ul class="fates__legend" aria-hidden="true">
          ${fates.map(([st, n]) => `<li class="fates__item"><span class="fates__mark fates__mark--${st}"></span>${esc(tr(SH_FATES[st]))} — ${n}</li>`).join('')}
        </ul>
      </div>
      <ul class="shrines" id="shr"></ul>
    </div>
  `;

  SHRINES.forEach((shrine, i) => {
    const picture = shrine.img
      ? `<img class="shrine__img" src="${thumb(shrine.img)}" alt="" loading="lazy" style="object-position: ${shrine.pos}">`
      : `<span class="shrine__placeholder" aria-hidden="true">${esc(tr(shrine.t))}</span>`;

    const button = createEl('button', 'shrine');
    button.type = 'button';
    button.innerHTML = `
      ${picture}
      <span class="shrine__body">
        <span class="status status--${shrine.st}">${esc(tr(shrine.s))}</span>
        <span class="shrine__title">${esc(tr(shrine.t))}</span>
        <span class="shrine__brief">${esc(tr(shrine.brief))}</span>
        <span class="more">${esc(ui().readDossier)} <span aria-hidden="true">→</span></span>
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
  /* прочитанное досье запоминается */
  remember('shrines', i);

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
    ${shrine.img ? `<img class="modal__img" src="${shrine.img}" alt="${esc(tr(shrine.alt || shrine.t))}">` : ''}
    <div>
      <span class="status status--${shrine.st}">${esc(tr(shrine.s))}</span>
      <h3 class="modal__title" id="m-title">${esc(tr(shrine.t))}</h3>
      <dl class="dossier">${dossier}</dl>
      ${listenHtml('shrine-' + (i + 1))}
      <p class="modal__source">${esc(tr(SH_LABELS.src))}: ${esc(tr(shrine.src))}</p>
    </div>
  `,
    !shrine.img
  );
}
