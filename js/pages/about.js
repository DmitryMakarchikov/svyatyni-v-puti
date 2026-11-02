'use strict';

/* О проекте: тема, цель, источники и авторы */

/* рисует раздел из данных ABOUT */
function renderAbout() {
  const p = texts();
  const items = ABOUT[lang]
    .map(([mod, title, body]) => {
      const content = Array.isArray(body)
        ? `<ul class="about__list">${body.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`
        : `<p class="about__text">${esc(body)}</p>`;
      return `
        <section class="about__item${mod ? ' about__item--' + mod : ''}">
          <h3 class="about__title">${esc(title)}</h3>
          ${content}
        </section>`;
    })
    .join('');

  $('#v-about').innerHTML =
    pageHead('about', p.abLab, p.abH) +
    `
    <div class="container">
      <div class="about">${items}</div>
    </div>
  `;
}
