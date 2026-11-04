// Nodo: «A1 validar». Modo: Run Once for Each Item. $json = respuesta HTTP del modelo.
const s = copia($('A1 preparar').item.json);
const r = registrarRespuesta(s, $json);
if (r.estado !== 'ok' || !r.json) {
  salida(s, 'A1', 'error', null, [], ['Sin respuesta válida del modelo'], r.dur, r.llamada_id);
  detener(s, 'error', 'Agente 1 sin respuesta válida (API caída, cuota o formato)');
  return { json: s };
}
const o = r.json;
const errores = [];
if (!['completo', 'aclaracion'].includes(o.estado)) errores.push('estado inválido');
const partidas = Array.isArray(o.partidas) ? o.partidas : [];
if (o.estado === 'completo') {
  if (partidas.length < 1 || partidas.length > 20) errores.push('número de partidas fuera de 1..20');
  partidas.forEach((p, i) => {
    if (typeof p.descripcion !== 'string' || p.descripcion.length < 2 || p.descripcion.length > 120) errores.push('descripción inválida en partida ' + i);
    if (!Number.isInteger(p.cantidad) || p.cantidad < 1 || p.cantidad > 5000) errores.push('cantidad inválida en partida ' + i);
  });
}
if (errores.length) {
  salida(s, 'A1', 'invalido', o, [], errores, r.dur, r.llamada_id);
  detener(s, 'error_validacion', 'Salida de A1 no cumple el contrato: ' + errores.join('; '));
  return { json: s };
}
if (o.estado === 'aclaracion') {
  const pregunta = String(o.pregunta_aclaracion || 'Indica productos y cantidades, por favor.').slice(0, 300);
  salida(s, 'A1', 'aclaracion', { faltantes: o.faltantes || [], pregunta }, [], [], r.dur, r.llamada_id);
  s.mensaje_usuario = pregunta;
  detener(s, 'requiere_aclaracion', 'A1 solicita aclaración: ' + (o.faltantes || []).join(', '));
  return { json: s };
}
s.a1 = { partidas: partidas.map(p => ({ descripcion: p.descripcion, cantidad: p.cantidad, unidad: p.unidad || '' })), fecha_requerida: o.fecha_requerida || null };
salida(s, 'A1', 'ok', s.a1, ['texto del cliente'], [], r.dur, r.llamada_id);
traza(s, 'A1', 'ok', partidas.length + ' partidas estructuradas');
s.siguiente = 'A2';
return { json: s };
