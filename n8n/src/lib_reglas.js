// ===== Reglas deterministas de PapelSur (fuente única) =====
// Se copia dentro de los nodos Code de n8n y se prueba en GitHub Actions (tests/test_reglas.js).
const POLITICA = {
  version: 'politica_comercial v1.0',
  IVA: 0.16,
  ENVIO_MXN: 250,
  ENVIO_GRATIS_DESDE: 3000,
  DESCUENTOS: [ { desde: 15000, pct: 0.08 }, { desde: 5000, pct: 0.05 } ],
  DESCUENTO_MAX: 0.10,
  MAX_TOTAL_MXN: 100000,
  MAX_CANTIDAD: 5000,
  MAX_PARTIDAS: 20,
  VIGENCIA_DIAS: 7,
  ETIQUETA: 'RESULTADO SIMULADO'
};

function r2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

// lineas: [{ sku, descripcion, cantidad, precio_unitario, existencia }]
function calcularCotizacion(lineas, P = POLITICA) {
  const errores = [];
  const advertencias = [];
  const detalle = [];
  if (!Array.isArray(lineas) || lineas.length === 0) errores.push('Sin líneas para cotizar');
  if (Array.isArray(lineas) && lineas.length > P.MAX_PARTIDAS) errores.push('Más de ' + P.MAX_PARTIDAS + ' partidas');
  for (const l of (lineas || [])) {
    const cant = l.cantidad;
    if (!Number.isInteger(cant) || cant < 1 || cant > P.MAX_CANTIDAD) { errores.push('Cantidad inválida en ' + l.sku); continue; }
    if (!(typeof l.precio_unitario === 'number' && l.precio_unitario > 0)) { errores.push('Precio inválido en ' + l.sku); continue; }
    const existencia = Number.isInteger(l.existencia) ? l.existencia : 0;
    if (existencia < cant) advertencias.push(l.sku + ': existencia ' + existencia + ' de ' + cant + ' solicitadas (entrega parcial o pedido especial)');
    detalle.push({ sku: l.sku, descripcion: l.descripcion, cantidad: cant, precio_unitario: l.precio_unitario, importe: r2(cant * l.precio_unitario) });
  }
  const subtotal = r2(detalle.reduce((a, d) => a + d.importe, 0));
  let pct = 0;
  for (const d of P.DESCUENTOS) { if (subtotal >= d.desde) { pct = d.pct; break; } }
  pct = Math.min(pct, P.DESCUENTO_MAX);
  const descuento = r2(subtotal * pct);
  const base = r2(subtotal - descuento);
  const envio = subtotal >= P.ENVIO_GRATIS_DESDE ? 0 : (detalle.length ? P.ENVIO_MXN : 0);
  const iva = r2((base + envio) * P.IVA);
  const total = r2(base + envio + iva);
  return {
    detalle, subtotal, descuento_pct: pct, descuento, envio, iva, total, moneda: 'MXN',
    requiere_escalar: total > P.MAX_TOTAL_MXN, errores, advertencias, politica: P.version
  };
}

// Revisión determinista del agente 4. Devuelve lista de fallas (vacía = pasa).
function verificarPropuesta(prop, catalogoItems, P = POLITICA) {
  const f = [];
  if (!prop || typeof prop !== 'object') return ['Propuesta ausente'];
  const porSku = {};
  for (const it of (catalogoItems || [])) porSku[it.sku] = it;
  for (const l of (prop.lineas || [])) {
    const c = porSku[l.sku];
    if (!c) f.push('SKU fuera del catálogo autorizado: ' + l.sku);
    else if (c.precio_mxn !== l.precio_unitario) f.push('Precio de ' + l.sku + ' no coincide con catálogo');
  }
  const recalculo = calcularCotizacion((prop.lineas || []).map(l => ({ ...l, existencia: (porSku[l.sku] || {}).existencia })), P);
  if (recalculo.total !== prop.total) f.push('Total no coincide con el recálculo (' + recalculo.total + ' vs ' + prop.total + ')');
  if (prop.descuento_pct > P.DESCUENTO_MAX) f.push('Descuento mayor al máximo de política');
  if (prop.vigencia_dias !== P.VIGENCIA_DIAS) f.push('Vigencia distinta de ' + P.VIGENCIA_DIAS + ' días');
  if (prop.etiqueta !== P.ETIQUETA) f.push('Falta la etiqueta RESULTADO SIMULADO');
  if (!Array.isArray(prop.supuestos) || prop.supuestos.length < 2) f.push('Faltan supuestos explícitos (mínimo 2)');
  const resumen = String(prop.resumen || '');
  if (resumen.length < 40 || resumen.length > 900) f.push('Resumen fuera de longitud (40 a 900 caracteres)');
  const texto = resumen + ' ' + (prop.supuestos || []).join(' ') + ' ' + (prop.condiciones || []).join(' ');
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(texto) || /\b\d{10}\b/.test(texto)) f.push('El texto contiene datos personales (correo o teléfono)');
  if (/(cr[eé]dito|pago a \d+ d[ií]as|garantizad)/i.test(texto)) f.push('Promete condiciones no autorizadas (crédito o garantías)');
  if (!Array.isArray(prop.fuentes) || !prop.fuentes.some(x => /catalogo/i.test(x))) f.push('No cita el catálogo como fuente');
  return f;
}

try { if (typeof module !== 'undefined' && module.exports) module.exports = { POLITICA, r2, calcularCotizacion, verificarPropuesta }; } catch (e) { /* entorno n8n */ }
