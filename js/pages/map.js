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
            <img class="map__img" src="${map.img}" alt="${esc(tr(map.t))}" width="1700" height="1820">
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
    </div>
  `;

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
      const tag = createEl('span', 'map__tag', tr(place.label));
      tag.setAttribute('aria-hidden', 'true');
      tag.style.left = place.x + '%';
      tag.style.top = place.y + '%';
      box.append(tag);
    }
  });

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
