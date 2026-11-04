# Diccionario de datos

## Tabla privada `casos` (n8n)
| Campo | Tipo | Descripción | ¿Público? |
|---|---|---|---|
| caso_id | texto | Folio `PS-AAAAMMDD-XXXX` | Sí |
| canal | texto | telegram / voz | Sí |
| usuario | texto | Seudónimo FNV (`u_…`) o `voz_publica` | No |
| chat_id | texto | Chat de Telegram para responder | No |
| estado | texto | Ver estados en `agentes/orquestador.md` | Sí |
| version | número | Versión de la propuesta liberada | Sí |
| texto | texto | Solicitud original | No |
| entrada_json / resultado_json | texto | Contrato y resultado completo con traza | No |
| total_mxn | número | Total con IVA (simulado) | Sí |
| expira_en / nonce | texto | Control de la aprobación | No |
| decision / decision_por | texto | Decisión y seudónimo | No |
| costo_usd | número | Suma de llamadas del caso | Sí |
| creado / actualizado | texto ISO | Marcas de tiempo UTC | Fecha sí |

## Tabla `costos`
Una fila por llamada: `fecha_hora, caso_id, llamada_id, etapa, agente, proveedor, modelo, tokens_entrada, tokens_salida, tokens_cache, duracion_voz_s, unidad_cobro, tarifa_entrada, tarifa_salida, costo, moneda, estado, reintento, origen (medido|estimado), duracion_ms`. No contiene datos personales y se publica en `costos/costos.csv`.

## Archivos públicos
- `web/data/panel.json`: KPI, conteo por estado, costo por agente e historial con 7 campos públicos.
- `datos/casos_sanitizados.csv`: mismos 7 campos para conciliación.
- `web/data/catalogo.json`: catálogo ficticio.
