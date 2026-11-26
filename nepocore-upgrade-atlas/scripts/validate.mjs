export const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonempty = (v) => typeof v === 'string' && v.trim().length > 0;
const maybeText = (v) => v === null || nonempty(v);
const count = (v) => v === null || Number.isSafeInteger(v) && v >= 0;
const texts = (v) => Array.isArray(v) && v.every(nonempty) && new Set(v).size === v.length;
export function https(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}
function date(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === v;
}
export function validate(data) {
  const check = (ok, field) => { if (!ok) throw new Error('Invalid catalogue field: ' + field); };
  check(data?.version === 1 && Array.isArray(data.models) && data.models.length, 'root');
  const ids = new Set();
  for (const m of data.models) {
    const label = (field) => m.id + '.' + field;
    check(typeof m.id === 'string' && slug.test(m.id) && !ids.has(m.id), 'model ID');
    ids.add(m.id);
    for (const f of ['manufacturer','name','series','platform','summary']) check(nonempty(m[f]), label(f));
    for (const f of ['machineTypes','aliases','notes']) check(texts(m[f]), label(f));
    check(m.machineTypes.every((s) => /^[A-Z0-9]{4}$/.test(s)), label('machineTypes'));
    check(m.sources && typeof m.sources === 'object' && Object.hasOwn(m.sources, 'identity'), label('sources'));
    for (const [id,s] of Object.entries(m.sources)) {
      check(slug.test(id) && https(s.url) && nonempty(s.title) && nonempty(s.section) && date(s.checked), label('sources.' + id));
    }
    const hasSource = (id) => typeof id === 'string' && Object.hasOwn(m.sources, id);
    const ram = m.memory;
    check(ram && maybeText(ram.type) && maybeText(ram.speed) && count(ram.sockets) &&
      maybeText(ram.module) && maybeText(ram.note) && hasSource(ram.source), label('memory'));
    check(Array.isArray(ram.configurations), label('memory.configurations'));
    const configs = new Set();
    for (const c of ram.configurations) {
      check(typeof c.id === 'string' && slug.test(c.id) && !configs.has(c.id) &&
        count(c.solderedGB) && count(c.documentedMaxGB) && count(c.factoryGB) &&
        count(c.independentTestGB) && (c.independentTestGB === null || hasSource(c.independentSource)) &&
        maybeText(c.note), label('memory configuration'));
      check(c.solderedGB == null || c.documentedMaxGB == null || c.solderedGB <= c.documentedMaxGB, label('memory capacity'));
      configs.add(c.id);
    }
    const s = m.storage;
    check(s && Array.isArray(s.positions) && maybeText(s.rule) && count(s.absoluteLimitGB) &&
      hasSource(s.source), label('storage'));
    for (const p of s.positions) {
      check(nonempty(p.position) && ['form','interface','link','offering','note'].every((f) => maybeText(p[f])) &&
        hasSource(p.source), label('storage position'));
    }
  }
  return data.models;
}
