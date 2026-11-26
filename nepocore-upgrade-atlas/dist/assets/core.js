export const unknown = 'Unknown';
export const show = (value) => value ?? unknown;
export const gb = (value) => value == null ? unknown : value + ' GB';
export const key = (value) => value.toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g, '');
export const limit = 3;
export const ramClass = (m) => m.memory.sockets == null ? 'unknown' : m.memory.sockets === 0 ? 'soldered' : 'replaceable';
export const ramLabel = (m) => ({unknown: 'Socket count unknown', soldered: 'Fully soldered RAM', replaceable: 'Replaceable RAM'})[ramClass(m)];
export const formLabel = (s) => s.form === 'M.2' ? 'M.2 (length unknown)' : show(s.form);

function queryMatch(m, query) {
  const clean = key(query);
  if (!clean) return true;
  // Match only documented terms. A full Lenovo MTM may begin with a known four-character type.
  if (m.machineTypes.some((code) => {
    const prefix = key(code);
    return clean === prefix || (clean.length === 10 && clean.startsWith(prefix));
  })) return true;
  const names = [m.name, ...m.aliases];
  const terms = names.flatMap((name) => [name, m.manufacturer + ' ' + name, name + ' ' + m.manufacturer]);
  return terms.some((name) => key(name).includes(clean));
}

export function findModels(models, {q = '', maker = '', ram = '', memory = '', storage = ''} = {}) {
  return models.filter((m) => queryMatch(m, q) &&
    (!maker || m.manufacturer === maker) &&
    (!ram || ramClass(m) === ram) &&
    (!memory || (m.memory.type ?? 'unknown') === memory) &&
    (!storage || (storage === 'unknown'
      ? !m.storage.positions.length || m.storage.positions.some((s) => !s.form || !s.interface || s.form === 'M.2')
      : m.storage.positions.some((s) => s.form === storage || s.interface === storage))));
}

export function validIds(values, models, max = Infinity) {
  if (!Array.isArray(values)) return [];
  const allowed = new Set(models.map(({id}) => id));
  return [...new Set(values.filter((id) => allowed.has(id)))].slice(0, max);
}

export function compareFields(m) {
  return [
    m.platform,
    m.machineTypes.join(' / ') || unknown,
    m.memory.type ? m.memory.type + ' · ' + show(m.memory.speed) : unknown,
    m.memory.sockets == null ? unknown : String(m.memory.sockets),
    m.memory.configurations.map((c) => gb(c.solderedGB)).join(' / ') || unknown,
    m.memory.sockets === 0 ? 'Fixed at factory capacity' : m.memory.configurations.map((c) => gb(c.documentedMaxGB) + ' · ' + (c.note ?? (gb(c.solderedGB) + ' soldered'))).join('\n') || unknown,
    m.memory.configurations.filter((c) => c.factoryGB != null).map((c) => gb(c.factoryGB) + (c.note ? ' · ' + c.note : '')).join('\n') || unknown,
    show(m.memory.note),
    m.storage.positions.map((s) => [s.position, formLabel(s), show(s.interface), show(s.link), s.offering, s.note].filter(Boolean).join(' · ')).join('\n') || unknown,
    show(m.storage.rule),
    gb(m.storage.absoluteLimitGB)
  ];
}
