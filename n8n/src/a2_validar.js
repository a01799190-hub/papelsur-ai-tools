// Nodo: «A2 validar». Modo: Run Once for Each Item.
const s = copia($('A2 preparar').item.json);
const r = registrarRespuesta(s, $json);
if (r.estado !== 'ok' || !r.json || !Array.isArray(r.json.coincidencias)) {
  salida(s, 'A2', 'error', null, [], ['Sin respuesta válida del modelo'], r.dur, r.llamada_id);
  detener(s, 'error', 'Agente 2 sin respuesta válida');
  return { json: s };
}
const porSku = {}; for (const it of s.catalogo.items) porSku[it.sku] = it;
const lineas = []; const noEncontradas = []; const advertencias = [];
s.a1.partidas.forEach((p, idx) => {
  const c = r.json.coincidencias.find(x => x.partida_idx === idx);
  const item = c && c.sku ? porSku[c.sku] : null;           // verificación contra la fuente autorizada
  if (!item) { noEncontradas.push(p.descripcion); return; }
  if (c.confianza === 'baja') advertencias.push('Coincidencia de baja confianza: "' + p.descripcion + '" → ' + item.sku);
  lineas.push({ sku: item.sku, descripcion: item.descripcion, cantidad: p.cantidad, precio_unitario: item.precio_mxn, existencia: item.existencia }); // precio y existencia del catálogo, no del modelo
});
if (noEncontradas.length) advertencias.push('Sin coincidencia en catálogo: ' + noEncontradas.join('; '));
if (!lineas.length) {
  salida(s, 'A2', 'insuficiencia', { no_encontradas: noEncontradas }, [s.catalogo.version], advertencias, r.dur, r.llamada_id);
  s.mensaje_usuario = 'No encontramos esos productos en el catálogo autorizado. Revisa la descripción o elige otros artículos.';
  detener(s, 'sin_coincidencias', 'A2 declara insuficiencia: ningún producto coincide con el catálogo');
  return { json: s };
}
s.a2 = { lineas, no_encontradas: noEncontradas, advertencias };
salida(s, 'A2', 'ok', { lineas: lineas.map(l => l.sku + ' x' + l.cantidad) }, [s.catalogo.version], advertencias, r.dur, r.llamada_id);
traza(s, 'A2', 'ok', lineas.length + ' líneas verificadas en ' + s.catalogo.version);
s.siguiente = 'A3';
return { json: s };
