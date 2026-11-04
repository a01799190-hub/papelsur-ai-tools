# Caso de negocio (una página)

## Empresa y sector
**PapelSur Distribuidora** (empresa **ficticia**), distribuidora B2B de papelería y consumibles de oficina en México. Atiende escuelas, despachos y oficinas pequeñas.

## Usuario, problema y decisión
- **Usuario:** ejecutivo comercial de PapelSur (aprobador) y cliente que pide la cotización.
- **Problema:** las cotizaciones se arman a mano, tardan horas, a veces aplican mal descuentos o prometen condiciones que no existen (por ejemplo, crédito).
- **Decisión que se apoya:** ¿envío esta cotización al cliente? (aprobar / rechazar la propuesta revisada).

## Proceso delimitado (inicio → fin)
**Inicio:** llega una solicitud de cotización por Telegram o por voz. **Fin:** propuesta aprobada o rechazada por una persona autorizada y registrada con su folio.

## Entradas, fuentes, reglas, salida y aprobación
| Elemento | Definición |
|---|---|
| Entradas | Texto libre con productos y cantidades (máx. 1 200 caracteres) |
| Fuentes permitidas | `web/data/catalogo.json` (12 SKUs ficticios) y `politica_comercial v1.0` |
| Reglas de negocio | IVA 16 %; descuento 5 % desde 5 000 MXN y 8 % desde 15 000 MXN (máx. 10 %); envío 250 MXN si el subtotal < 3 000; vigencia 7 días; total > 100 000 MXN se deriva a persona; sin crédito ni garantías |
| Salida útil | Cotización con líneas, subtotal, descuento, envío, IVA, total, supuestos y etiqueta RESULTADO SIMULADO |
| Acción con aprobación humana | Registrar la «orden de prueba» de la propuesta (simulada) |

## KPI
| KPI | Fórmula | Unidad | Periodo | Fuente | Meta (esperada, no medida) |
|---|---|---|---|---|---|
| Tiempo de ciclo | Σ(actualizado − creado) de casos completos / casos completos | minutos | periodo de pruebas | tabla `casos` | < 10 min |
| Aprobación a la primera | casos con propuesta aprobada por A4 en V1 / casos con propuesta × 100 | % | periodo de pruebas | tabla `casos` | ≥ 80 % |
| Costo variable por caso | costo de IA medido de casos completos / casos completos | USD por caso | periodo de pruebas | tabla `costos` | < 0.01 USD |

Los valores **medidos** salen del panel; las metas son expectativas y se reportan por separado.

## Datos ficticios, servicios en vivo y acciones simuladas
- **Ficticios:** empresa, catálogo, precios, clientes y solicitudes.
- **En vivo:** Telegram Bot API, n8n, Gemini API, ElevenLabs, GitHub Pages y Actions.
- **Simuladas:** la «orden» aprobada; no hay compras, pagos ni envíos reales.
