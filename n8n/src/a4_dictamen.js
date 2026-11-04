// Nodo: «A4 dictamen (loop de calidad)». Modo: Run Once for Each Item.
// Salida «siguiente»: 'liberar' | 'corregir' (vuelve a A3) | 'cierre' (detenido).
const s = copia($('A4 preparar').item.json);
let dictamen = 'devuelto', correcciones = [], observaciones = '', dur = 0, ref = null;
if (s.a4_via_llm) {
  const r = registrarRespuesta(s, $json);
  dur = r.dur; ref = r.llamada_id;
  if (r.estado === 'ok' && r.json && ['aprobado', 'devuelto'].includes(r.json.dictamen)) {
    dictamen = r.json.dictamen;
    correcciones = Array.isArray(r.json.correcciones) ? r.json.correcciones.map(String).filter(Boolean).slice(0, 8) : [];
    observaciones = String(r.json.observaciones || '').slice(0, 300);
  } else {
    correcciones = ['Revisor sin respuesta válida: se trata como devuelto (falla segura)'];
  }
} else {
  dictamen = 'devuelto';
  correcciones = s.a4_fallas_auto.map(f => 'Corregir: ' + f);
  observaciones = 'Devuelto por la capa determinista; no se llamó al modelo (ahorro de costo)';
}
if (dictamen === 'devuelto' && !correcciones.length) correcciones = ['Revisar coherencia con el skill de revisión'];
const v = s.propuesta.version;
s.historial_versiones.push({ version: v, dictamen, correcciones, costo_acumulado_usd: Number(s.gastado_usd.toFixed(8)) });
salida(s, 'A4', dictamen, { version: v, correcciones, observaciones }, [s.skills.calidad.nombre + ' v' + s.skills.calidad.version], [], dur, ref);
traza(s, 'A4', dictamen, 'v' + v + (correcciones.length ? ': ' + correcciones.join(' | ') : ''));
if (dictamen === 'aprobado') {
  s.estado = 'pendiente_aprobacion'; s.siguiente = 'liberar';
  traza(s, 'ORQ', 'liberado', 'Propuesta v' + v + ' liberada a aprobación humana');
  return { json: s };
}
if (v >= s.max_versiones) { detener(s, 'detenido_revision', 'Se agotaron ' + s.max_versiones + ' versiones sin aprobación del revisor'); return { json: s }; }
s.iter_calidad += 1; s.correcciones = correcciones; s.siguiente = 'corregir';
traza(s, 'ORQ', 'loop_calidad', 'Regresa a A3 para versión ' + (v + 1));
return { json: s };
