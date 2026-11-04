// Pruebas de las reglas deterministas (se ejecutan en GitHub Actions antes de publicar).
const assert = require('assert');
const { calcularCotizacion, verificarPropuesta, POLITICA } = require('../n8n/src/lib_reglas.js');
const cat = require('../web/data/catalogo.json');
const casos = require('../datos/casos_referencia.json');
let n = 0;
for (const c of casos) {
  const lineas = c.lineas.map(l => { const it = cat.items.find(i => i.sku === l.sku); return { sku: l.sku, descripcion: it.descripcion, cantidad: l.cantidad, precio_unitario: it.precio_mxn, existencia: it.existencia }; });
  const r = calcularCotizacion(lineas);
  assert.strictEqual(r.total, c.total_esperado, c.id + ': total ' + r.total + ' ≠ ' + c.total_esperado);
  assert.strictEqual(r.descuento_pct, c.descuento_pct_esperado, c.id + ': descuento');
  n++;
}
// Política de catálogo: precios positivos, SKUs únicos, existencias enteras
const skus = new Set();
for (const it of cat.items) {
  assert.ok(it.precio_mxn > 0, 'Precio no positivo en ' + it.sku);
  assert.ok(Number.isInteger(it.existencia) && it.existencia >= 0, 'Existencia inválida en ' + it.sku);
  assert.ok(!skus.has(it.sku), 'SKU duplicado ' + it.sku); skus.add(it.sku);
}
// El revisor detecta una propuesta alterada
const l = [{ sku: 'PS-HOJ-CAR', descripcion: 'x', cantidad: 2, precio_unitario: 689, existencia: 120 }];
const c = calcularCotizacion(l);
const prop = { lineas: c.detalle, total: c.total + 1, descuento_pct: 0, vigencia_dias: 7, etiqueta: POLITICA.ETIQUETA, supuestos: ['a', 'b'], resumen: 'x'.repeat(50), fuentes: ['catalogo-2026-11-01'] };
assert.ok(verificarPropuesta(prop, cat.items).some(f => /Total/.test(f)), 'El revisor no detectó total alterado');
console.log('test_reglas: ' + n + ' casos de referencia y controles de catálogo aprobados');
