'use strict';

/* Карта 1913 года: номера на карте открывают карточку места */

/* выбранное место (-1 — ничего не выбрано) */
let mapSelected = -1;

/* рисует карту с маршрутом и точками */
function renderMap() {
  const p = texts();
  const map = DOCS['d-map'];

  $('#v-map').innerHTML =
    pageHead('map', p.mapH, p.mapLead) +
    `
    <div class="container">
      <div class="map-layout">
        <div>
          <div class="map" id="mapbox">
            <img class="map__img" src="${map.img}" srcset="img/map-1913-1000.jpg 1000w, ${map.img} 1700w" sizes="(max-width: 900px) 100vw, 700px" alt="${esc(tr(map.t))}" width="1700" height="1820" fetchpriority="high">
            <svg class="map__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <!-- пути беженства 1915 года: Гродно → Скидель → Лида и Белосток → Волковыск → Слоним → на Барановичи -->
              <polyline points="47.8,21.9 57,25.4 80.7,16.3" />
              <polyline points="31.8,39.3 60.2,40.1 79.2,43.6 97,43" />
            </svg>
          </div>
          <div class="map-legend">
            <span class="map-legend__item"><span class="map-legend__mark"></span>${esc(p.legPin)}</span>
            <span class="map-legend__item"><span class="map-legend__mark map-legend__mark--route"></span>${esc(p.legRoute)}</span>
          </div>
          <p class="caption map__source">${esc(tr(map.src))}</p>
        </div>
        <aside class="card place" id="place" aria-live="polite"></aside>
      </div>

      <section class="places" aria-labelledby="h-places">
        <h3 class="map-quiz__title" id="h-places">${esc(p.mapListH)}</h3>
        <ul class="places__list">
          ${PLACES.map((place, i) => {
            const far = place.km > 0 ? p.mapKm(place.km) : place.km === 0 ? p.mapHere : p.mapEast;
            return `
              <li>
                <button class="places__item" type="button" data-place="${i}">
                  <span class="places__num" aria-hidden="true">${place.n}</span>
                  <span class="places__name">${esc(tr(place.t))}</span>
                  <span class="places__brief">${esc(tr(place.brief))}</span>
                  <span class="places__km">${esc(far)}</span>
                </button>
              </li>`;
          }).join('')}
        </ul>
      </section>

      <section class="map-quiz" aria-labelledby="h-mapquiz">
        <h3 class="map-quiz__title" id="h-mapquiz">${esc(p.mapQuizH)}</h3>
        <div class="map-quiz__list">
          ${p.mapQuiz
            .map(
              (item, i) => `
                <div class="card map-quiz__item" data-i="${i}">
                  <p class="map-quiz__question">${esc(item.q)}</p>
                  <div class="options">${optionsHtml(item.o)}</div>
                  <p class="explain" hidden>${esc(item.e)}</p>
                </div>`
            )
            .join('')}
        </div>
      </section>
    </div>
  `;

  /* вопросы к карте: один ответ на вопрос, затем пояснение */
  $$('.map-quiz__item').forEach((box) => {
    const item = p.mapQuiz[Number(box.dataset.i)];
    $$('.option', box).forEach((option) =>
      option.addEventListener('click', () => {
        const picked = Number(option.dataset.k);
        markAnswer(box, picked, item.a);
        $('.explain', box).hidden = false;
        if (picked === item.a) playBell(659.25, 0.04);
      })
    );
  });

  /* точки ставятся в процентах, поэтому не съезжают при любом размере карты */
  const box = $('#mapbox');
  PLACES.forEach((place, i) => {
    const seen = progress.places.includes(i) ? ' map__pin--seen' : '';
    const pin = createEl('button', 'map__pin' + seen, String(place.n));
    pin.type = 'button';
    pin.style.left = place.x + '%';
    pin.style.top = place.y + '%';
    pin.setAttribute('aria-label', tr(place.t));
    pin.setAttribute('aria-pressed', String(i === mapSelected));
    pin.addEventListener('click', () => selectPlace(i));
    box.append(pin);

    /* подпись для места, которого нет на самой карте */
    if (place.label) {
      const tag = createEl('span', 'map__tag' + (place.labelLeft ? ' map__tag--left' : ''), tr(place.label));
      tag.setAttribute('aria-hidden', 'true');
      tag.style.left = place.x + '%';
      tag.style.top = place.y + '%';
      box.append(tag);
    }
  });

  /* куда вели дороги беженства дальше на восток */
  ROUTE_ENDS.forEach((end) => {
    const tag = createEl('span', 'map__tag map__tag--route', tr(end.t));
    tag.setAttribute('aria-hidden', 'true');
    tag.style.left = end.x + '%';
    tag.style.top = end.y + '%';
    box.append(tag);
  });

  /* список мест: выбор точки и переход к карте */
  $$('.places__item').forEach((item) =>
    item.addEventListener('click', () => {
      selectPlace(Number(item.dataset.place));
      if (innerWidth >= 900) $('#mapbox').scrollIntoView({ block: 'start' });
    })
  );

  paintPlace();
}

/* выбор точки на карте */
function selectPlace(i) {
  mapSelected = i;
  /* печать за 4 открытых места */
  if (remember('places', i) && progress.places.length >= 4) addStamp('map');

  $$('.map__pin').forEach((pin, j) => {
    pin.setAttribute('aria-pressed', String(j === i));
    pin.classList.toggle('map__pin--seen', progress.places.includes(j));
  });
  paintPlace();

  /* на телефоне карточка под картой — прокручиваем к ней */
  if (innerWidth < 900) {
    $('#place').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

/* карточка выбранного места */
function paintPlace() {
  const p = texts();
  const box = $('#place');

  if (mapSelected < 0) {
    box.innerHTML = `
      <h3 class="place__title">${esc(p.mapPick)}</h3>
      <p class="place__text">${esc(p.mapPickP)}</p>
    `;
    return;
  }

  const place = PLACES[mapSelected];
  const doc = place.doc ? DOCS[place.doc] : null;

  box.innerHTML = `
    ${doc ? `<img class="place__img" src="${thumb(doc.img)}" alt="${esc(tr(doc.t))}">` : ''}
    <p class="eyebrow">${place.n} / ${PLACES.length}</p>
    <h3 class="place__title">${esc(tr(place.t))}</h3>
    <p class="place__text">${esc(tr(place.text))}</p>
    <div class="actions">
      <a class="button button--small button--primary" href="#${place.go}">
        ${esc(p.mapGo[place.go])} <span class="button__arrow" aria-hidden="true">→</span>
      </a>
      ${doc ? `<button class="button button--small" type="button" id="pl-doc">${esc(ui().open)}</button>` : ''}
    </div>
  `;

  if (doc) $('#pl-doc').addEventListener('click', () => openDoc(place.doc));
}
