'use strict';

/* Семейный архив: воспоминания о беженстве 1915 года в семье посетителя.
   Записи лежат в базе данных браузера IndexedDB только на этом устройстве.
   Файл .json переносит их на другой компьютер или в репозиторий проекта. */

const FAMILY_DB = 'svyatyni-v-puti';
const FAMILY_STORE = 'family';
/* ограничения длины полей, как в форме */
const FAMILY_LIMITS = { who: 120, from: 120, to: 120, story: 2000 };

let familyDb = null;
let familyQuery = '';

/* открывает базу один раз; без IndexedDB (старый браузер, запрет) — null, тогда пишем в localStorage */
function openFamilyDb() {
  if (!familyDb) {
    familyDb = new Promise((resolve) => {
      try {
        const request = indexedDB.open(FAMILY_DB, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(FAMILY_STORE, { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }
  return familyDb;
}

/* одна транзакция: work получает хранилище и может вернуть запрос, его результат и вернётся */
function familyTx(db, mode, work) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FAMILY_STORE, mode);
    const request = work(tx.objectStore(FAMILY_STORE));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/* записи из запасного localStorage (там может оказаться что угодно) */
function savedFamily() {
  const rows = store.get('family', []);
  return Array.isArray(rows) ? rows.map(cleanRecord).filter(Boolean) : [];
}

/* Операции с записями: одинаковые для IndexedDB и запасного localStorage */
const family = {
  /* все записи, новые сверху */
  async all() {
    const db = await openFamilyDb();
    const rows = db ? await familyTx(db, 'readonly', (s) => s.getAll()) : savedFamily();
    return rows.sort((a, b) => b.created.localeCompare(a.created));
  },

  /* сохраняет записи; запись с тем же id заменяется, поэтому повторный импорт не создаёт копий */
  async put(records) {
    const db = await openFamilyDb();
    if (db) return familyTx(db, 'readwrite', (s) => records.forEach((r) => s.put(r)));
    const byId = new Map(savedFamily().map((r) => [r.id, r]));
    records.forEach((r) => byId.set(r.id, r));
    store.set('family', [...byId.values()]);
  },

  async remove(id) {
    const db = await openFamilyDb();
    if (db) return familyTx(db, 'readwrite', (s) => s.delete(id));
    store.set(
      'family',
      savedFamily().filter((r) => r.id !== id)
    );
  }
};

/* приводит запись к нужному виду: только строки, обрезанные по длине; без имени запись не нужна */
function cleanRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const record = {};
  Object.entries(FAMILY_LIMITS).forEach(([key, max]) => {
    record[key] = typeof raw[key] === 'string' ? raw[key].trim().slice(0, max) : '';
  });
  if (!record.who) return null;
  record.created =
    typeof raw.created === 'string' && !isNaN(Date.parse(raw.created))
      ? raw.created
      : new Date().toISOString();
  record.id =
    typeof raw.id === 'string' && raw.id
      ? raw.id.slice(0, 40)
      : 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return record;
}

/* рисует блок внутри раздела «Архив» */
function renderFamily(box) {
  const p = texts();
  box.innerHTML = `
    <section class="family" aria-labelledby="h-family">
      <h3 class="family__title" id="h-family">${esc(p.famH)}</h3>
      <p class="family__lead">${esc(p.famLead)}</p>
      <div class="family__layout">
        <form class="card family__form" id="f-form">
          <label class="field">
            <span class="field__label">${esc(p.famWho)}</span>
            <input class="field__input" type="text" name="who" required maxlength="${FAMILY_LIMITS.who}" placeholder="${esc(p.famWhoPh)}" autocomplete="off">
          </label>
          <div class="family__pair">
            <label class="field">
              <span class="field__label">${esc(p.famFrom)}</span>
              <input class="field__input" type="text" name="from" maxlength="${FAMILY_LIMITS.from}" placeholder="${esc(p.famFromPh)}" autocomplete="off">
            </label>
            <label class="field">
              <span class="field__label">${esc(p.famTo)}</span>
              <input class="field__input" type="text" name="to" maxlength="${FAMILY_LIMITS.to}" placeholder="${esc(p.famToPh)}" autocomplete="off">
            </label>
          </div>
          <label class="field">
            <span class="field__label">${esc(p.famStory)}</span>
            <textarea class="field__input field__input--area" name="story" rows="5" maxlength="${FAMILY_LIMITS.story}" placeholder="${esc(p.famStoryPh)}"></textarea>
          </label>
          <button class="button button--primary" type="submit">${esc(p.famSave)}</button>
        </form>

        <div class="family__records">
          <div class="family__bar">
            <label class="search family__search">
              <svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <input class="search__input" type="search" id="f-q" placeholder="${esc(p.famSearch)}" aria-label="${esc(p.famSearch)}">
            </label>
            <button class="button button--small" type="button" id="f-export">${esc(p.famExport)}</button>
            <button class="button button--small" type="button" id="f-import">${esc(p.famImport)}</button>
            <input type="file" id="f-file" accept=".json,application/json" hidden>
          </div>
          <p class="caption family__count" id="f-count" aria-live="polite"></p>
          <ul class="family__list" id="f-list"></ul>
        </div>
      </div>
      <p class="caption family__note">${esc(p.famNote)}</p>
    </section>
  `;

  const form = $('#f-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const record = cleanRecord(Object.fromEntries(new FormData(form)));
    if (!record) return;
    await family.put([record]);
    /* просим браузер не стирать базу при нехватке места */
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    form.reset();
    showToast(p.famSaved);
    paintFamily();
  });

  const search = $('#f-q');
  search.value = familyQuery;
  search.addEventListener('input', () => {
    familyQuery = search.value;
    paintFamily();
  });

  $('#f-export').addEventListener('click', exportFamily);
  $('#f-import').addEventListener('click', () => $('#f-file').click());
  $('#f-file').addEventListener('change', (e) => importFamily(e.target));

  paintFamily();
}

/* перерисовывает список записей с учётом поиска */
async function paintFamily() {
  const list = $('#f-list');
  if (!list) return;
  const p = texts();
  const rows = await family.all();
  const query = familyQuery.trim().toLowerCase();
  const shown = query
    ? rows.filter((r) => [r.who, r.from, r.to, r.story].join(' ').toLowerCase().includes(query))
    : rows;

  $('#f-count').textContent = rows.length ? p.famCount(shown.length, rows.length) : '';
  $('#f-export').disabled = !rows.length;
  list.innerHTML = '';

  if (!shown.length) {
    list.append(createEl('li', 'empty-state', rows.length ? ui().none : p.famEmpty));
    return;
  }

  /* дата цифрами: белорусской локали нет в некоторых браузерах */
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  shown.forEach((r) => {
    const route = [r.from, r.to].filter(Boolean).join(' → ');
    const item = createEl('li', 'memory');
    item.innerHTML = `
      <p class="memory__who">${esc(r.who)}</p>
      ${route ? `<p class="memory__route">${esc(route)}</p>` : ''}
      ${r.story ? `<p class="memory__story">${esc(r.story)}</p>` : ''}
      <div class="memory__foot">
        <span class="caption">${esc(dateFormat.format(new Date(r.created)))}</span>
        <button class="memory__delete" type="button">${esc(p.famDelete)}</button>
      </div>
    `;

    /* удаление в два нажатия: первое спрашивает, второе удаляет */
    const del = $('.memory__delete', item);
    del.setAttribute('aria-label', `${p.famDelete}: ${r.who}`);
    del.addEventListener('click', async () => {
      if (!del.classList.contains('memory__delete--sure')) {
        del.classList.add('memory__delete--sure');
        del.textContent = p.famSure;
        return;
      }
      await family.remove(r.id);
      paintFamily();
    });
    del.addEventListener('blur', () => {
      del.classList.remove('memory__delete--sure');
      del.textContent = p.famDelete;
    });

    list.append(item);
  });
}

/* сохраняет все записи в файл .json */
async function exportFamily() {
  const records = await family.all();
  if (!records.length) return;
  const data = { app: 'svyatyni-v-puti', version: 1, exported: new Date().toISOString(), records };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = createEl('a');
  link.href = URL.createObjectURL(blob);
  link.download = `family-archive-${data.exported.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* читает файл .json и добавляет записи (свой формат или просто массив) */
async function importFamily(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  const p = texts();
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.records;
    const records = (Array.isArray(list) ? list : []).slice(0, 500).map(cleanRecord).filter(Boolean);
    if (!records.length) throw new Error('empty');
    await family.put(records);
    showToast(p.famImported(records.length));
    paintFamily();
  } catch (e) {
    showToast(p.famBadFile);
  }
}
