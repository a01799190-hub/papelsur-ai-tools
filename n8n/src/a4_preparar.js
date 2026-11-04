// Nodo: «A4 preparar». Modo: Run Once for All Items.
// Salida «siguiente»: 'llm' (revisión con modelo) o 'dictamen' (fallas deterministas: no se gasta en el modelo).
const s = copia($input.first().json);
const SYSTEM = __PROMPT_A4__;
s.a4_fallas_auto = verificarPropuesta(s.propuesta, s.catalogo.items);
traza(s, 'A4', 'capa_determinista', s.a4_fallas_auto.length ? ('Fallas: ' + s.a4_fallas_auto.join(' | ')) : 'Sin fallas automáticas');
if (s.a4_fallas_auto.length) { s.a4_via_llm = false; s.siguiente = 'dictamen'; return [{ json: s }]; }
const user = JSON.stringify({ caso_id: s.caso_id, solicitud: s.a1.partidas, propuesta: s.propuesta, reglas_del_skill_de_revision: s.skills.calidad.reglas });
const p = prepararLlamada(s, 'A4', 'agente_4_revisor', SYSTEM, user, 400);
if (!p.ok) { detener(s, 'detenido_presupuesto', p.motivo); return [{ json: s }]; }
s.a4_via_llm = true; s.siguiente = 'llm';
return [{ json: s }];
