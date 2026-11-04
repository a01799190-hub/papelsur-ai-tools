# Loop 1 — Calidad de negocio

**Secuencia:** Generar (A3) → medir campos, cálculos y fuentes (`verificarPropuesta`) → diagnosticar (A4) → corregir (vuelve a A3 con `correcciones`) → validar. Se libera solo si supera los criterios.

| Elemento | Definición |
|---|---|
| Entrada | Líneas verificadas de A2 y cálculo determinista |
| Responsable | Orquestador (nodo «Loop de calidad») con A3 y A4 |
| Criterios | `verificarPropuesta` sin fallas **y** dictamen `aprobado` del modelo revisor |
| Máximo de iteraciones | 3 versiones de propuesta (V1, V2, V3) |
| Tiempo límite | 120 s por caso (compartido con el loop 2) |
| Presupuesto | 0.02 USD por caso (compartido) |
| Acción de retorno | A3 recibe la lista de correcciones y genera la versión siguiente |
| Estado al agotar el límite | `detenido_revision` — no se pide aprobación humana |

**Implementación:** `n8n/src/a4_dictamen.js` (salida `corregir` → «A3 preparar»).

## Evidencia V1 → V2
Envía en Telegram: `/nuevo 40 cajas de hojas carta y 30 paquetes de plumas azules #demo-loop`.
`#demo-loop` hace que la V1 se genere **sin** las reglas del skill (falla declarada para demostración). A4 la devuelve («Faltan supuestos explícitos…»), A3 genera la V2 con el skill y A4 la aprueba. Guarda en `loops/evidencia/` la traza (`resultado_json` del caso) con el mismo `caso_id`, el diagnóstico y el costo adicional (filas de costo con `reintento = 1`).

## Autoevaluación (0–4)
| Claridad | Contexto/secuencia | Evidencia | Control/retorno | Utilidad | Total |
|---|---|---|---|---|---|
| 4 | 4 | 3 (completar con tu traza real) | 4 | 4 | 19/20 |
