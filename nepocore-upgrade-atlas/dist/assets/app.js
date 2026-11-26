import models from './catalogue.js';
import {findModels, validIds, compareFields, limit} from './core.js';

const page = document.body.dataset.page;
const root = document.body.dataset.root;
const home = (id) => root + 'models/' + id + '/index.html';
const savedKey = 'nepocore-atlas.saved.v1';
const compareKey = 'nepocore-atlas.compare.v1';
const byId = new Map(models.map((m) => [m.id,m]));
const announce = document.querySelector('#announce');
const params = new URLSearchParams(location.search);
let storageAvailable = true;
function read(key, max) {
  try {
    const value = localStorage.getItem(key);
    try {
      return validIds(JSON.parse(value), models, max);
    } catch {
      return [];
    }
  } catch {
    storageAvailable = false;
    return [];
  }
}
function persist(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    storageAvailable = false;
  }
}
let saved = read(savedKey);
let selected = read(compareKey, limit);
if (page === 'compare' && params.has('models')) {
  selected = validIds((params.get('models') ?? '').slice(0,400).split(','), models, limit);
  persist(compareKey, selected);
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function link(text, href) {
  const a = element('a', text);
  a.href = href;
  return a;
}
const tray = element('aside', undefined, 'tray');
tray.setAttribute('aria-label', 'Selected models');
const trayText = element('span');
const trayLink = link('Open comparison', root + 'compare/index.html');
trayLink.className = 'button primary';
tray.append(trayText,trayLink);
if (page !== 'compare' && document.querySelector('[data-compare]')) document.body.append(tray);

function syncActions() {
  for (const [attr, ids, idle, active] of [
    ['save', saved, 'Save', 'Saved'], ['compare', selected, 'Compare', 'Added']
  ]) {
    for (const button of document.querySelectorAll('[data-'+attr+']')) {
      const id = button.dataset[attr];
      const on = ids.includes(id);
      button.hidden = false;
      button.setAttribute('aria-pressed', String(on));
      button.setAttribute('aria-label', (attr === 'save' ? 'Save ' : 'Compare ') + byId.get(id).name);
      button.querySelector('span').textContent = on ? active : idle;
    }
  }
  tray.hidden = !selected.length;
  trayText.textContent = selected.length + ' of 3 selected';
  trayLink.href = root + 'compare/index.html?models=' + encodeURIComponent(selected.join(','));
}
function renderSaved() {
  if (page !== 'saved') return;
  document.querySelector('#saved-toolbar').hidden = !saved.length;
  document.querySelector('#saved-empty').hidden = !!saved.length;
  document.querySelector('#saved-count').textContent = saved.length + (saved.length === 1 ? ' saved model' : ' saved models');
  for (const card of document.querySelectorAll('[data-card]')) card.hidden = !saved.includes(card.dataset.card);
}
function toggleSaved(id, focus) {
  const on = saved.includes(id);
  saved = on ? saved.filter((item) => item !== id) : [...saved,id];
  persist(savedKey,saved);
  syncActions();
  renderSaved();
  if (page === 'saved' && on && focus) {
    (document.querySelector('[data-card]:not([hidden]) [data-save]') ?? document.querySelector('#saved-empty a')).focus();
  }
  announce.textContent = byId.get(id).name + (on ? ' removed from your shortlist.' : ' saved.') +
    (storageAvailable ? '' : ' Browser storage is unavailable. Changes last on this page.');
}
function updateCompare(id) {
  const on = selected.includes(id);
  if (!on && selected.length >= limit) {
    announce.textContent = 'Three models selected. Open comparison to remove a model.';
    trayLink.focus();
    return false;
  }
  selected = on ? selected.filter((item) => item !== id) : [...selected,id];
  persist(compareKey, selected);
  if (page === 'compare' && params.has('models')) {
    params.set('models', selected.join(','));
    try {
      history.replaceState(null, '', '?' + params.toString());
    } catch {
      // The current comparison remains usable without history access.
    }
  }
  announce.textContent = byId.get(id).name + (on ? ' removed from comparison.' : ' added to comparison.');
  syncActions();
  renderCompare();
  return true;
}

const headings = ['Processor platform','Machine types','Memory type and speed','Replaceable RAM sockets','Soldered RAM options','Lenovo documented RAM maximum','Factory RAM totals','Memory notes','Storage positions and interfaces','Storage restrictions','Absolute supported storage ceiling'];
function renderCompare() {
  if (page !== 'compare') return;
  const form = document.querySelector('#compare-form');
  const select = form.querySelector('select');
  const add = form.querySelector('button');
  const target = document.querySelector('#comparison');
  const full = selected.length >= Math.min(limit, models.length);
  form.parentElement.hidden = false;
  for (const option of select.options) option.disabled = selected.includes(option.value);
  select.value = '';
  select.disabled = full;
  add.disabled = full;
  document.querySelector('#compare-count').textContent = selected.length + ' of 3 models selected' + (full ? ' · Remove a model to add another.' : '');
  target.replaceChildren();
  if (!selected.length) {
    target.append(element('p','Choose a model above or select models from the catalogue.','empty'));
    return;
  }
  const region = element('div',undefined,'table-wrap');
  region.tabIndex = 0;
  region.setAttribute('role','region');
  region.setAttribute('aria-label','Model comparison table');
  const table = element('table',undefined,'comparison-table');
  const header = table.createTHead().insertRow();
  const label = element('th','Specification');
  label.scope = 'col';
  header.append(label);
  const active = selected.map((id) => byId.get(id));
  for (const m of active) {
    const th = element('th');
    th.scope = 'col';
    const remove = element('button','Remove','button quiet');
    remove.type = 'button';
    remove.setAttribute('aria-label','Remove '+m.name);
    remove.addEventListener('click', () => {
      updateCompare(m.id);
      select.focus();
    });
    th.append(link(m.name,home(m.id)), remove);
    header.append(th);
  }
  const fields = active.map(compareFields);
  const rows = table.createTBody();
  headings.forEach((title,i) => {
    const row = rows.insertRow();
    const th = element('th', title);
    th.scope = 'row';
    row.append(th);
    for (const model of fields) row.append(element('td',model[i]));
  });
  region.append(table);
  target.append(region);
  const caveat = element('p','For claim references and check dates, open the model pages linked above.','source-note');
  target.append(caveat);
}
function bindCatalogue() {
  const input = document.querySelector('#catalogue-search');
  const filters = ['maker','ram','memory','storage'].map((id) => document.getElementById(id));
  const cards = document.querySelectorAll('[data-card]');
  const count = document.querySelector('#count');
  input.value = (params.get('q') ?? '').slice(0,100);
  document.querySelector('.filters').hidden = false;
  function apply() {
    const values = Object.fromEntries(filters.map(({id,value}) => [id,value]));
    const matches = new Set(findModels(models, {...values,q:input.value}).map((m) => m.id));
    for (const card of cards) card.hidden = !matches.has(card.dataset.card);
    count.textContent = matches.size + (matches.size === 1 ? ' model' : ' models');
    document.querySelector('#empty').hidden = !!matches.size;
  }
  input.form.addEventListener('submit', (event) => {
    event.preventDefault();
    apply();
  });
  input.addEventListener('input',apply);
  for (const filter of filters) filter.addEventListener('change',apply);
  document.querySelector('#reset').addEventListener('click', () => {
    input.value = '';
    for (const filter of filters) filter.value = '';
    if (params.has('q')) {
      params.delete('q');
      try {
        history.replaceState(null,'',location.pathname + (params.size ? '?' + params : ''));
      } catch {
        // The UI still resets when history is unavailable.
      }
    }
    apply();
    input.focus();
  });
  apply();
}
function bindModel() {
  const copy = document.querySelector('#copy');
  const print = document.querySelector('#print');
  copy.hidden = print.hidden = false;
  print.addEventListener('click', () => window.print());
  copy.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.hash = url.search = '';
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = 'Model link copied.';
    } catch {
      const field = document.querySelector('#model-url');
      document.querySelector('#manual-link').hidden = false;
      field.value = url.href;
      field.focus();
      field.select();
      status.textContent = 'Copy the selected address using your device’s copy command.';
    }
  });
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-save],button[data-compare]');
  if (!button) return;
  if (byId.has(button.dataset.save)) toggleSaved(button.dataset.save,true);
  if (byId.has(button.dataset.compare)) updateCompare(button.dataset.compare);
});
if (page === 'catalogue') bindCatalogue();
if (page === 'model') bindModel();
if (page === 'compare') {
  renderCompare();
  document.querySelector('#compare-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const select = event.currentTarget.querySelector('select');
    if (byId.has(select.value) && !selected.includes(select.value)) {
      updateCompare(select.value);
      (select.disabled ? document.querySelector('.comparison-table button') : select).focus();
    }
  });
}
if (page === 'saved') {
  renderSaved();
  document.querySelector('#clear-saved').addEventListener('click', () => {
    saved = [];
    persist(savedKey,saved);
    syncActions();
    renderSaved();
    document.querySelector('#saved-empty a').focus();
    announce.textContent = 'Shortlist cleared.';
  });
  if (!storageAvailable) document.querySelector('.page-head').append(element('p','Browser storage is unavailable. Saved selections last on the current page.','note'));
}
syncActions();
window.addEventListener('storage', (event) => {
  if (event.key === savedKey || event.key === null) saved = read(savedKey);
  if (event.key === compareKey || event.key === null) selected = read(compareKey,limit);
  syncActions();
  renderSaved();
  renderCompare();
});
