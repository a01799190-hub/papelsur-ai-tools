# Orquestador — PapelSur

**Tipo:** controlador determinista (nodos Code de n8n). No usa LLM: decide con reglas verificables, lo que reduce costo y evita que una instrucción del usuario cambie el flujo.

## Responsabilidades
1. Validar el contrato de entrada (`agentes/contratos/entrada.schema.json`): `caso_id`, canal, usuario seudonimizado, objetivo, texto, modo `SIMULADO`, límite de costo.
2. Bloquear inyección de instrucciones **antes** de llamar a cualquier modelo (aplica a Telegram y a voz).
3. Cargar los skills y el catálogo autorizado mediante el **adaptador** (HTTP GET a URLs fijas de GitHub Pages) y registrar su versión en la traza.
4. Ejecutar el plan fijo `A1 → A2 → A3 → A4`. Antes de cada llamada aplica el **loop de seguridad y costo** (`loops/loop_seguridad_costo.md`).
5. Validar cada salida contra su contrato. Si una salida es inválida, detiene el caso con un estado de error; nunca lo presenta como exitoso.
6. Coordinar el **loop de calidad** (`loops/loop_calidad.md`): si A4 devuelve la propuesta, regresa a A3 con las correcciones; máximo 3 versiones.
7. Cerrar el caso con un estado final y un resumen de costos.

## Estados posibles de cierre
| Estado | Significado |
|---|---|
| `pendiente_aprobacion` | Propuesta aprobada por A4; espera aprobación humana en Telegram |
| `requiere_aclaracion` | A1 detectó datos faltantes; se pregunta al usuario |
| `sin_coincidencias` | A2 no encontró productos en el catálogo autorizado |
| `escalado_humano` | Total mayor a 100 000 MXN (fuera de política) |
| `bloqueado_politica` | Se detectó inyección de instrucciones o contenido prohibido |
| `detenido_revision` | Se agotaron 3 versiones sin aprobación de A4 |
| `detenido_presupuesto` | Se alcanzó el límite de costo, llamadas o tiempo |
| `error` / `error_validacion` | Falla de API o salida que no cumple el contrato |

## Límites por caso (configurables en el nodo «Guardrails de entrada»)
- Costo máximo: 0.02 USD · Llamadas máximas: 10 · Tiempo máximo: 120 s · Versiones de propuesta: 3.
