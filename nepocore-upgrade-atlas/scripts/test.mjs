import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {validate} from './validate.mjs';
import {findModels, validIds, compareFields, ramClass} from '../assets/core.js';

const read = (p) => readFile(p,'utf8');
const data = JSON.parse(await read('data/catalogue.json'));
const models = validate(data);
const ids = (...queries) => queries.map((query) => findModels(models,query).map((m) => m.id));
const idsAll = models.map((m) => m.id);
const t480 = 'thinkpad-t480';
const t14 = 'thinkpad-t14-gen-2-intel';
const x280 = 'thinkpad-x280';
const record = (id) => models.find((m) => m.id === id);

test('catalogue validates and rejects malformed IDs, limits, sources and dates', () => {
  assert.equal(models.length, 6);
  for (const change of [
    (d) => {d.models[0].id='../etc';},
    (d) => {d.models[1].id=d.models[0].id;},
    (d) => {d.models[0].memory.sockets='0';},
    (d) => {d.models[0].memory.configurations[0].documentedMaxGB=-1;},
    (d) => {d.models[0].storage.positions[0].source='toString';},
    (d) => {d.models[0].sources.psref.url='javascript:void(0)';},
    (d) => {d.models[0].sources.psref.checked='2026-02-30';}
  ]) {
    const copy = structuredClone(data);
    change(copy);
    assert.throws(() => validate(copy),/Invalid catalogue field/);
  }
});
test('exact alias, punctuation, type code and generation search', () => {
  assert.deepEqual(ids({q:'  THINKpad  T-480 '}, {q:'20-ke'}, {q:'20KF0067US'}, {q:'T14 Generation 2 (Intel)'},
    {q:'T14 Gen 2 AMD'}, {q:'T480s'}, {q:'T14 Gen 3 Intel'}, {q:'no-such-model'}), [[t480],[x280],[x280],[t14],[],[],[],[]]);
  assert.equal(findModels(models,{q:'T14'}).length, 2);
  assert.deepEqual(ids({}), [idsAll]);
});
test('filters compose and distinguish zero sockets and unknown details', () => {
  assert.deepEqual(ids({maker:'Lenovo',ram:'soldered',memory:'DDR4',storage:'NVMe'}),[[x280]]);
  assert.deepEqual(ids({maker:'Other'}, {ram:'unknown'}, {memory:'unknown'}, {storage:'unknown'}),[[],[],[],[t480,x280]]);
  assert.equal(ramClass(record(x280)),'soldered');
  const unknown = structuredClone(record(t480));
  unknown.memory.sockets = null;
  unknown.memory.type = null;
  assert.equal(ramClass(unknown),'unknown');
  assert.equal(findModels([unknown],{ram:'soldered'}).length,0);
  assert.equal(findModels([unknown],{ram:'unknown',memory:'unknown'}).length,1);
});
test('comparison whitelist, selection cap and equivalent rows retain restrictions', () => {
  assert.deepEqual(validIds(['unknown',t480,t480,x280,t14,idsAll[1]],models,3),[t480,x280,t14]);
  assert.deepEqual(validIds('t480',models),[]);
  const fields = compareFields(record(t14));
  assert.match(fields[5], /40 GB · 8 GB onboard[^\n]+\n48 GB · 16 GB onboard/);
  assert.match(fields[8], /PCIe 3.0 ×4 slot/);
  assert.equal(fields.at(-1),'Unknown');
  assert.equal(compareFields(record(x280))[3],'0');
  assert.match(compareFields(record(x280))[6], /4 GB · Lenovo excludes/);
  assert.match(compareFields(record(t480))[9], /mutually exclusive/);
});

test('build emits static content, plain local links, valid anchors and opt-in routes', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], {env:{...process.env, ATLAS_BASE_PATH:''}});
  const pages = (await readdir('dist', {recursive:true})).filter((p) => p.endsWith('.html'));
  assert.equal(pages.length, 20);
  const cache = new Map();
  for (const page of pages) cache.set(resolve('dist',page),await read('dist/'+page));
  const titles = new Set();
  for (const [page, html] of cache) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title),page);
    titles.add(title);
    assert.equal([...html.matchAll(/<h1[ >]/g)].length,1,page);
    for (const [,value] of html.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
      if (/^https:\/\//.test(value)) continue;
      const [path,fragment] = value.split('#');
      const route = path.split('?')[0];
      const target = route.startsWith('/') ? resolve('dist', '.' + route) : route ? resolve(dirname(page),route) : page;
      assert.ok(target.startsWith(resolve('dist') + '/'),value);
      await access(target);
      if (fragment) assert.ok(cache.get(target)?.includes('id="'+fragment+'"'),page+' '+value);
    }
  }
  const html = cache.get(resolve('dist/models',t14,'index.html'));
  for (const phrase of ['8 GB onboard','16 GB onboard','40 GB','48 GB','alternatives','Lenovo Product Specifications Reference','2026-11-26']) assert.ok(html.includes(phrase),phrase);
  const home = cache.get(resolve('dist/index.html'));
  assert.match(home,/20KE/);
  assert.doesNotMatch(home,/mailto:|googlesyndication/);
});
