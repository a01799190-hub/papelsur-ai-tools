// Nodo: «A2 preparar». Modo: Run Once for All Items.
const s = copia($input.first().json);
const SYSTEM = __PROMPT_A2__;
const catalogoMin = s.catalogo.items.map(i => ({ sku: i.sku, descripcion: i.descripcion, unidad: i.unidad }));
const user = JSON.stringify({ caso_id: s.caso_id, partidas: s.a1.partidas.map((p, i) => ({ partida_idx: i, ...p })), catalogo: catalogoMin });
const p = prepararLlamada(s, 'A2', 'agente_2_catalogo', SYSTEM, user, 500);
if (!p.ok) detener(s, 'detenido_presupuesto', p.motivo); else s.siguiente = 'llm';
return [{ json: s }];
