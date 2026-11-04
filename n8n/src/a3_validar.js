// Nodo: «A3 validar». Modo: Run Once for Each Item.
const s = copia($('A3 preparar').item.json);
const r = registrarRespuesta(s, $json);
if (r.estado !== 'ok') {
  salida(s, 'A3', 'error', null, [], ['Sin respuesta del modelo'], r.dur, r.llamada_id);
  detener(s, 'error', 'Agente 3 sin respuesta (API caída o cuota)');
  return { json: s };
}
const o = r.json || {};
const c = s.a3_calc;
const version = s.iter_calidad + 1;
// El servidor arma la propuesta: números del cálculo, textos del modelo.
s.propuesta = {
  caso_id: s.caso_id, version, etiqueta: POLITICA.ETIQUETA, moneda: 'MXN',
  lineas: c.detalle, subtotal: c.subtotal, descuento_pct: c.descuento_pct, descuento: c.descuento,
  envio: c.envio, iva: c.iva, total: c.total, vigencia_dias: POLITICA.VIGENCIA_DIAS,
  resumen: typeof o.resumen === 'string' ? o.resumen : '',
  supuestos: Array.isArray(o.supuestos) ? o.supuestos.map(String).slice(0, 8) : [],
  condiciones: Array.isArray(o.condiciones) ? o.condiciones.map(String).slice(0, 8) : [],
  fuentes: [s.catalogo.version, POLITICA.version],
  skill: s.skills.negocio.nombre + ' v' + s.skills.negocio.version
};
salida(s, 'A3', 'ok', { version, total: c.total }, s.propuesta.fuentes, c.advertencias, r.dur, r.llamada_id);
traza(s, 'A3', 'ok', 'Propuesta v' + version + ' total ' + c.total + ' MXN');
s.siguiente = 'A4';
return { json: s };
