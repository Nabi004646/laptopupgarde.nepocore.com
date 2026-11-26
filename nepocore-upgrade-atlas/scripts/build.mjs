import {mkdir, readFile, writeFile, cp, rm} from 'node:fs/promises';
import {dirname, relative} from 'node:path';
import {validate, https, slug} from './validate.mjs';
import {gb, show, ramLabel, ramClass, formLabel} from '../assets/core.js';

const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const models = validate(await json('data/catalogue.json'));
const guides = await json('data/guides.json');
const config = await json('config.json');
if (config.siteUrl !== null && (!https(config.siteUrl) || /[?#]/.test(config.siteUrl))) throw new Error('Set siteUrl to an HTTPS deployment base URL.');
if (config.correctionEmail !== null && !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(config.correctionEmail)) throw new Error('Invalid correction address.');
for (const guide of guides) {
  if (!slug.test(guide.id) || !guide.sources.every(([, url]) => https(url))) throw new Error('Invalid guide.');
}

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const icons = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  ram:'<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M6 17v3m4-3v3m4-3v3m4-3v3M7 10v3m5-3v3m5-3v3"/>',
  drive:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 13h18m-5 3h2"/>',
  save:'<path d="M6 4h12v16l-6-4-6 4z"/>',
  compare:'<path d="M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4"/>',
  laptop:'<rect x="4" y="4" width="16" height="12" rx="1"/><path d="m4 16-2 4h20l-2-4M9 20h6"/>',
  book:'<path d="M12 6v14M3 4c4 0 7 0 9 2 2-2 5-2 9-2v14c-4 0-7 0-9 2-2-2-5-2-9-2z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  shield:'<path d="M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10z"/><path d="m9 12 2 2 4-4"/>',
  external:'<path d="M13 4h7v7m0-7-9 9m8-1v7H5V5h7"/>'
};
const icon = (name) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? ''}</svg>`;
const paths = [];
const routes = [['catalogue/','Catalogue'],['compare/','Compare'],['saved/','Saved'],['guides/','Guides']];
const site = config.siteUrl ? config.siteUrl.replace(/\/+$/, '') + '/' : null;
const deploymentPath = (process.env.ATLAS_BASE_PATH ?? '').replace(/\/+$/, '');
if (deploymentPath && !/^(?:\/[a-z0-9_][a-z0-9_.-]*)+$/i.test(deploymentPath)) {
  throw new Error('ATLAS_BASE_PATH must be an absolute URL path, such as /project.');
}
const errorPageRoot = deploymentPath + '/';
const urlFor = (p) => site + p.replace(/index\.html$/, '');
function shell(path, {title, desc, active = '', body, page = '', wide = false}) {
  const parent = relative(dirname(path), '.');
  const root = path === '404.html' ? errorPageRoot : parent ? parent + '/' : './';
  const links = routes.map(([p,label]) => `<a href="${root+p}index.html"${active === p ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · NepoCore Upgrade Atlas</title><meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#101f2c"><link rel="icon" href="${root}assets/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/style.css">${site && path !== '404.html' ? `<link rel="canonical" href="${esc(urlFor(path))}">` : ''}
<script type="module" src="${root}assets/app.js"></script></head>
<body data-page="${page}" data-root="${root}"><a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap nav-shell">
<a class="brand" href="${root}index.html"><img src="${root}assets/mark.svg" width="36" height="36" alt=""><span><strong>NepoCore</strong><small>UPGRADE ATLAS</small></span></a>
<nav aria-label="Main navigation">${links}</nav>
</div></header>
<main id="main"${wide ? '' : ' class="wrap inner"'}>${body}</main>
<div class="sr-only" id="announce" aria-live="polite"></div>
<footer class="site-footer"><div class="wrap footer-row"><div><strong>NepoCore Upgrade Atlas</strong><p>Independent laptop upgrade reference</p></div><nav aria-label="Footer"><a href="${root}about/index.html">Methodology</a><a href="${root}privacy/index.html">Privacy</a>${config.correctionEmail ? `<a href="${root}corrections/index.html">Corrections</a>` : ''}</nav></div></footer>
</body></html>`;
}
const write = async (path, options) => {
  paths.push(path);
  const out = 'dist/' + path;
  await mkdir(dirname(out), {recursive:true});
  await writeFile(out, shell(path, options));
};
function actions(m, root) {
  return `<div class="actions"><button class="button quiet" type="button" data-compare="${m.id}" aria-pressed="false" hidden>${icon('compare')}<span>Compare</span></button><button class="button quiet" type="button" data-save="${m.id}" aria-pressed="false" hidden>${icon('save')}<span>Save</span></button><a class="button subtle" href="${root}models/${m.id}/index.html">View specs ${icon('arrow')}</a></div>`;
}
const card = (m, root) => `<article class="card" data-card="${m.id}">
<div class="card-top"><span class="tile">${icon('laptop')}</span><span class="pill ${ramClass(m)}">${ramLabel(m)}</span></div>
<p class="eyebrow muted">${esc(m.manufacturer)} · ${esc(m.series)}</p>
<h3><a href="${root}models/${m.id}/index.html">${esc(m.name)}</a></h3>
<p class="platform">${esc(m.platform)} <span>·</span> ${esc(m.machineTypes.join(' / ') || 'Machine type unknown')}</p>
<p class="summary">${esc(m.summary)}</p>${actions(m,root)}</article>`;
const head = (label,title,desc) => `<div class="page-head"><p class="eyebrow">${label}</p><h1>${title}</h1><p class="lead">${desc}</p></div>`;
const search = (id, action, button) => `<form class="searchbar" action="${action}" role="search"><label class="sr-only" for="${id}">Model name or machine type</label><span class="search-icon">${icon('search')}</span><input type="search" id="${id}" name="q" maxlength="100" placeholder="Search by model or machine type"><button class="button primary" type="submit">${button} ${icon('arrow')}</button></form>`;
const guideCard = (g,root) => `<a class="guide-card" href="${root}guides/${g.id}/index.html"><span class="tile">${icon(g.icon)}</span><div><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></div>${icon('arrow')}</a>`;

await rm('dist', {force:true, recursive:true});
await mkdir('dist', {recursive:true});
await cp('assets', 'dist/assets', {recursive:true});
await writeFile('dist/assets/catalogue.js', 'export default ' + JSON.stringify(models).replaceAll('<','\\u003c') + ';\n');
await write('index.html', {title:'Find laptop RAM and storage upgrades',desc:'Look up exact Lenovo ThinkPad models and compare documented memory sockets, storage formats and upgrade limits.',page:'home',wide:true,body:
`<section class="hero"><div class="wrap hero-grid"><div class="hero-copy"><p class="eyebrow hero-label"><span></span> LAPTOP UPGRADE REFERENCE</p><h1>Know what your<br>laptop <em>can take.</em></h1><p>Look up your exact laptop model for documented RAM and storage options, configuration caveats and manufacturer sources.</p>
${search('home-search','catalogue/index.html','Find a model')}
<div class="examples"><span>Try</span> ${['T480','T14 Gen 2 Intel','20KE'].map((q)=>`<a href="catalogue/index.html?q=${encodeURIComponent(q)}">${q}</a>`).join('')}</div>
</div><img class="hero-art" src="assets/laptop.svg" alt="" width="520" height="395"></div></section>
<div class="evidence"><div class="wrap evidence-row"><span>${icon('laptop')} ${models.length} ThinkPad platforms</span><span>${icon('shield')} Manufacturer sources</span><span>${icon('compare')} Compare up to 3 models</span></div></div>
<section class="wrap section"><div class="section-head"><div><p class="eyebrow">THE CATALOGUE</p><h2>Explore laptop models</h2></div><a class="button outline" href="catalogue/index.html">Browse catalogue ${icon('arrow')}</a></div><div class="grid">${[models[0],models[4],models[2]].map(m=>card(m,'./')).join('')}</div></section>
<template id="advertising-slot"><aside class="advertising" aria-label="Advertisement"><p>Advertisement</p><div data-ad-placement></div></aside></template>
<section class="guide-band"><div class="wrap section"><div class="section-head"><div><p class="eyebrow">UPGRADE GUIDES</p><h2>Know what to check</h2></div><a class="button outline" href="guides/index.html">All guides ${icon('arrow')}</a></div><div class="grid">${[guides[0],guides[1],guides[3]].map(g=>guideCard(g,'./')).join('')}</div></div></section>`});
const options = (values) => values.map(([v,t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
const select = (id,label,values) => `<label>${label}<select id="${id}">${options(values)}</select></label>`;
const uniq = (v) => [...new Set(v.filter(Boolean))].sort();
await write('catalogue/index.html',{title:'Laptop catalogue',desc:'Search exact machine types and filter by memory sockets, memory generation and storage interface.',page:'catalogue',active:'catalogue/',body:
head('CATALOGUE','Find your laptop','Match the model name, generation and machine type before choosing parts.')+
search('catalogue-search','index.html','Search')+
`<div class="filters" hidden>${select('maker','Manufacturer',[['','All manufacturers'],...uniq(models.map(m=>m.manufacturer)).map(v=>[v,v])])}${select('ram','RAM sockets',[['','Any socket type'],['replaceable','Replaceable RAM'],['soldered','Fully soldered RAM'],['unknown','Unknown']])}${select('memory','Memory type',[['','All memory types'],...uniq(models.map(m=>m.memory.type)).map(v=>[v,v]),['unknown','Unknown']])}${select('storage','Storage format or interface',[['','All storage types'],...uniq(models.flatMap(m=>m.storage.positions.flatMap(s=>[s.form,s.interface])).filter(v=>v!=='M.2')).map(v=>[v,v]),['unknown','Unknown details']])}<button id="reset" class="button outline" type="button">Reset filters</button></div>
<div class="results-bar"><p id="count" role="status">${models.length} models</p><a href="../guides/identify-your-laptop/index.html">Help me find my machine type ${icon('arrow')}</a></div>
<p id="empty" class="empty" hidden>No matching models. Check the generation or machine type, or reset the filters.</p>
<div class="grid">${models.map(m=>card(m,'../')).join('')}</div><noscript><p>Search and filters require JavaScript. Browse all models above.</p></noscript>`});
function table(headers, rows, className = '') {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(headers[0])} table"><table class="${className}"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(([title,...cells])=>`<tr><th scope="row">${esc(title)}</th>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const pair = (k,v) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
const ref = (s) => `<a href="#source-${s}">${s === 'psref' ? 'Lenovo PSREF' : s === 'identity' ? 'Lenovo Support' : 'View source'}</a>`;
for (const m of models) {
  const r = m.memory;
  const s = m.storage;
  const checked = Object.values(m.sources).map(a=>a.checked).sort().at(-1);
  await write('models/'+m.id+'/index.html',{title:m.name+' RAM and storage',desc:m.summary,page:'model',active:'catalogue/',body:
  `<a class="back" href="../../catalogue/index.html">← Laptop catalogue</a>
  <div class="detail-head" data-model="${m.id}">${head(esc(m.manufacturer+' · '+m.series),esc(m.name),esc(m.summary))}
  <dl class="metrics">${pair('Processor platform',m.platform)}${pair('Machine types shown',m.machineTypes.join(' / ') || 'Unknown')}${pair('Replaceable RAM sockets',show(r.sockets))}${pair('Last checked',checked)}</dl>
  <p class="source-note">Identity source ${ref('identity')}. Match your installed hardware as well as the machine type.</p>
  <div class="actions detail-actions"><button class="button outline" data-save="${m.id}" type="button" aria-pressed="false" hidden>${icon('save')}<span>Save</span></button><button class="button outline" data-compare="${m.id}" type="button" aria-pressed="false" hidden>${icon('compare')}<span>Compare</span></button><button id="copy" class="button outline" type="button" hidden>Copy model link</button><button id="print" class="button outline" type="button" hidden>Open print dialog</button></div>
  <label id="manual-link" hidden>Copy this model URL<input id="model-url" type="text" readonly></label><p id="copy-status" class="source-note" role="status"></p></div>
  <div class="detail-grid"><div class="detail-main">
  <section class="panel" id="memory"><h2>${icon('ram')} Memory (RAM)</h2><dl class="metrics three">${pair('Memory type',show(r.type))}${pair('Documented speed',show(r.speed))}${pair('Replaceable module',r.sockets === 0 ? 'None' : show(r.module))}</dl>
  <p class="note">${esc(show(r.note))}</p>${r.configurations.length ? table(['Configuration','Soldered RAM','Lenovo documented maximum','Factory total','Configuration notes'],r.configurations.map(c=>[c.solderedGB === 0 ? 'Socketed only' : c.solderedGB === null ? 'Unknown' : gb(c.solderedGB)+' onboard',esc(gb(c.solderedGB)),esc(c.documentedMaxGB === null && r.sockets === 0 ? 'Fixed at factory capacity' : gb(c.documentedMaxGB)),esc(gb(c.factoryGB)),esc(c.note ?? '—')])) : '<p>Memory configurations unknown.</p>'}
  <p class="source-note">Memory reference ${ref(r.source)}.</p>${r.configurations.filter(c=>c.independentTestGB!==null).map(c=>`<p>Independent test for ${esc(c.id)} · ${gb(c.independentTestGB)} · ${ref(c.independentSource)}</p>`).join('')}</section>
  <section class="panel" id="storage"><h2>${icon('drive')} Storage</h2><p class="note">${esc(show(s.rule))}</p>
  ${s.positions.length ? table(['Position','Form factor','Interface','Lenovo-listed capacity','Configuration notes'],s.positions.map(p=>[p.position,esc(formLabel(p)),esc(show(p.interface)+' · '+show(p.link)),esc(show(p.offering)),esc(p.note ?? '—')+' '+ref(p.source)])) : '<p>Storage positions unknown.</p>'}
  <p>Absolute supported storage ceiling <strong>${gb(s.absoluteLimitGB)}</strong>.</p></section>
  <section class="panel sources" id="sources"><h2>${icon('book')} Manufacturer sources</h2>${Object.entries(m.sources).map(([id,d])=>`<div id="source-${id}"><a href="${esc(d.url)}">${esc(d.title)} ${icon('external')}</a><p>${esc(d.section)} · Checked <time datetime="${esc(d.checked)}">${esc(d.checked)}</time></p></div>`).join('')}</section>
  ${m.notes.length ? '<section class="panel"><h2>Additional notes</h2>'+m.notes.map(n=>'<p>'+esc(n)+'</p>').join('')+'</section>' : ''}</div>
  <aside class="detail-side"><section class="panel"><h2>Check before buying</h2><ul class="checklist"><li>Match your machine type and processor platform.</li><li>${r.sockets===0 ? 'Confirm the amount of soldered memory fitted to your unit.' : 'Check the onboard RAM, existing modules and the documented total for your configuration.'}</li><li>Match the drive interface, length and mounting hardware.</li><li>Check shared positions and configuration exclusions.</li><li>Use Lenovo’s documentation for your exact unit.</li></ul><a href="../../guides/buying-checklist/index.html">Full buying checklist ${icon('arrow')}</a></section>
  <section class="panel related"><h2>Related guides</h2>${[guides[0],guides[1],guides[2],guides[3],guides[4]].map(g=>`<a href="../../guides/${g.id}/index.html">${esc(g.title)}</a>`).join('')}</section></aside></div>`});
}
await write('compare/index.html',{title:'Compare laptops',desc:'Compare up to three exact laptop models side by side, with conditional RAM limits and storage options.',active:'compare/',page:'compare',body:
head('COMPARISON','Compare models','Add up to three laptops to compare their RAM, storage and configuration limits.')+
`<div class="comparison-controls" hidden><form id="compare-form"><label for="add-model">Add a model</label><select id="add-model" required><option value="">Choose an exact model</option>${options(models.map(m=>[m.id,m.name]))}</select><button class="button primary" type="submit">Add model</button></form><a href="../catalogue/index.html">Browse catalogue ${icon('arrow')}</a></div><p id="compare-count" role="status"></p><div id="comparison"></div><noscript><p>Comparison requires JavaScript. <a href="../catalogue/index.html">Browse the model catalogue</a>.</p></noscript>`});
await write('saved/index.html',{title:'Saved models',desc:'Review your device-local shortlist of laptop models.',active:'saved/',page:'saved',body:
head('SHORTLIST','Saved models','Keep the laptops you’re considering in a shortlist on this device.')+
`<div id="saved-toolbar" class="results-bar" hidden><p id="saved-count" role="status"></p><button id="clear-saved" type="button" class="button outline">Clear saved models</button></div><p id="saved-empty" class="empty" hidden>Your shortlist is empty. <a href="../catalogue/index.html">Browse the catalogue</a> to save a model.</p><div class="grid">${models.map(m=>card(m,'../').replace('data-card=', 'hidden data-card=')).join('')}</div><noscript><p>Saved models require JavaScript.</p></noscript>`});
await write('guides/index.html',{title:'Upgrade guides',desc:'Original guides to identifying your laptop and checking RAM and storage compatibility.',active:'guides/',body:
head('UPGRADE GUIDES','Laptop upgrade guides','Identify your hardware and verify parts before ordering.')+`<div class="grid">${guides.map(g=>guideCard(g,'../')).join('')}</div>`});
for (const g of guides) await write('guides/'+g.id+'/index.html',{title:g.title,desc:g.description,active:'guides/',body:
`<a class="back" href="../index.html">← All guides</a>${head('UPGRADE GUIDE',esc(g.title),esc(g.description))}<article class="prose panel">${g.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<h2>Sources</h2><ul>${g.sources.map(([h,u])=>`<li><a href="${esc(u)}">${esc(h)}</a></li>`).join('')}</ul><p><a href="../../catalogue/index.html">Find your laptop in the catalogue ${icon('arrow')}</a></p></article>`});
await write('about/index.html',{title:'Editorial methodology',desc:'How NepoCore researches, records and checks its exact laptop upgrade specifications.',body:
head('METHODOLOGY','How we document upgrades','NepoCore Upgrade Atlas is an independent reference for laptop RAM and storage.')+
`<article class="panel prose"><h2>What we check</h2><p>We read Lenovo’s platform specifications for memory, storage and configuration restrictions. Support pages document the machine-type codes shown. Some platforms have additional regional or special-bid types beyond those listed. Platforms with different generations or processor variants have separate entries.</p><h2>How to read the evidence</h2><dl><dt>Manufacturer documented</dt><dd>The linked reference gives a specification or an explicit supported value.</dd><dt>Conditional</dt><dd>A value depends on the unit’s configuration, region, adapter or another stated condition.</dd><dt>Factory or Lenovo offering</dt><dd>A listed or tested configuration identified in the manufacturer’s reference.</dd><dt>Independent test</dt><dd>An independently documented hardware result with its own source. The first release contains no such entries.</dd><dt>Unknown</dt><dd>The cited evidence leaves the value open. Unverified possibilities do not inform compatibility claims.</dd></dl><h2>Corrections</h2>${config.correctionEmail ? '<p><a href="../corrections/index.html">Report a catalogue correction</a>.</p>' : '<p>The correction contact is currently unavailable.</p>'}</article>`});
await write('privacy/index.html',{title:'Privacy',desc:'What the site stores locally and what happens when you open external sources.',body:
head('PRIVACY','Privacy','Search, comparison and saved models run in your browser.')+
`<article class="panel prose"><h2>Browser storage</h2><p>This website stores only catalogue model identifiers for your shortlist and comparison. You can remove selections in the interface or clear this site’s data from your browser settings. When browser storage is unavailable, selections last for the current page.</p><h2>Network requests</h2><p>The site has no accounts, tracking scripts, advertising scripts or external fonts. A static host may keep standard request logs. Search terms submitted from the home page can appear in the URL and host logs. Enter a model name or machine type and keep your serial number private. External source sites apply their own privacy policies.</p></article>`});
if (config.correctionEmail) await write('corrections/index.html',{title:'Report a correction',desc:'Send an evidence-backed correction to the Atlas editor.',body:
head('CORRECTIONS','Report a correction','Include the model, the affected specification and the manufacturer source.')+
`<p><a class="button outline" href="mailto:${esc(config.correctionEmail)}?subject=Upgrade%20Atlas%20correction">Email the editor</a></p>`});
await write('404.html',{title:'Page not found',desc:'Find a laptop model in the catalogue.',body:head('404','Page not found','Use the catalogue to locate the model you need.')+`<a class="button outline" href="${errorPageRoot}catalogue/index.html">Open catalogue</a>`});
if (site) await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+paths.filter(p=>p!=='404.html').map(p=>'<url><loc>'+esc(urlFor(p))+'</loc></url>').join('\n')+'\n</urlset>\n');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\n'+(site ? 'Sitemap: '+site+'sitemap.xml\n' : ''));
await cp('docs/security-headers.example','dist/_headers');
console.log('Generated '+paths.length+' HTML pages for '+models.length+' laptop platforms.');
