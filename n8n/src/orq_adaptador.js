// Nodo: «Adaptador skills + catálogo». Modo: Run Once for All Items.
// Lee los SKILL.md y el catálogo desde URLs FIJAS (lista permitida) de tu GitHub Pages.
const BASE = 'https://REEMPLAZAR_USUARIO.github.io/REEMPLAZAR_REPO'; // ← tu URL de Pages, sin "/" final
const RECURSOS = {
  negocio: BASE + '/skills/cotizacion-papelsur/SKILL.md',
  calidad: BASE + '/skills/revision-propuesta/SKILL.md',
  catalogo: BASE + '/data/catalogo.json'
};
const entrada = $input.first().json;
const http = this.helpers;

function seccion(md, titulo) {
  const i = md.indexOf('## ' + titulo);
  if (i < 0) return '';
  const resto = md.slice(i + titulo.length + 3);
  const j = resto.search(/\n## /);
  return (j >= 0 ? resto.slice(0, j) : resto).trim();
}
function leerSkill(md, nombre) {
  const v = /^version:\s*([0-9.]+)\s*$/m.exec(md);
  const reglas = seccion(md, 'Reglas');
  if (!v || !reglas) throw new Error('Skill ' + nombre + ' sin versión o sin sección Reglas');
  return { nombre, version: v[1], reglas };
}

const resultado = { ...entrada, adaptador: { cargado_en: new Date().toISOString(), urls: RECURSOS, ok: false } };
try {
  const [mdN, mdC, cat] = await Promise.all([
    http.httpRequest({ method: 'GET', url: RECURSOS.negocio, timeout: 10000 }),
    http.httpRequest({ method: 'GET', url: RECURSOS.calidad, timeout: 10000 }),
    http.httpRequest({ method: 'GET', url: RECURSOS.catalogo, timeout: 10000 })
  ]);
  const catalogo = typeof cat === 'string' ? JSON.parse(cat) : cat;
  if (!catalogo || !Array.isArray(catalogo.items) || !catalogo.items.length) throw new Error('Catálogo vacío o inválido');
  resultado.skills = { negocio: leerSkill(String(mdN), 'cotizacion-papelsur'), calidad: leerSkill(String(mdC), 'revision-propuesta') };
  resultado.catalogo = { version: catalogo.version, items: catalogo.items };
  resultado.adaptador.ok = true;
} catch (e) {
  resultado.adaptador.error = String(e.message || e).slice(0, 200);
}
return [{ json: resultado }];
