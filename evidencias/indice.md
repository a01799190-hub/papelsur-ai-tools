# Índice de enlaces y evidencias por criterio de la rúbrica

**Estudiante:** Yelitza Cahue · **Proyecto:** PapelSur Distribuidora (empresa ficticia, modo SIMULADO)

## Enlaces

| Recurso | Enlace |
|---|---|
| Panel público (GitHub Pages) | https://a01799190-hub.github.io/papelsur-ai-tools/ |
| Repositorio | https://github.com/a01799190-hub/papelsur-ai-tools |
| GitHub Actions | https://github.com/a01799190-hub/papelsur-ai-tools/actions |
| Ejecución bloqueada por control (#12) | Actions → «Delete web/index.html» (commit e627ff8) |
| Ejecución corregida y publicada (#13) | Actions → «Rename papelsur_index.html to index.html» (commit 2fc622e) |
| Bot de Telegram | gorditasdenata (acceso restringido a usuarios autorizados; se comparte por el canal privado del curso) |
| Rama / commit final | `main` · commit 2fc622e |

## Evidencias por criterio

| # | Criterio (pts) | Evidencia | Ruta |
|---|---|---|---|
| 1 | Caso e integración (5) | Caso, KPI, diagrama, caso_id compartido | `docs/01_caso.md`, `docs/02_arquitectura.md`, informe §1–2 |
| 2 | Ecosistema agéntico (15) | Prompts, contratos, ejecución con A1–A4 en verde, traza del loop | `agentes/`, `evidencias/n8n/n8n_WF2_orquestador_*.png`, `loops/evidencia/caso_demo_loop.json` |
| 3 | n8n y Telegram (12) | Workflows, lista de ejecuciones (éxito y error), ruta de aprobación | `n8n/`, `evidencias/n8n/`, `evidencias/P10/`, `evidencias/P03/P03_U3JE_*.png` |
| 4 | Pages y Actions (10) | Panel publicado, ejecución bloqueada y corregida | `evidencias/pages/`, `evidencias/P12/` |
| 5 | Skills y loops (10) | SKILL.md, carga en traza, V1→V2, reutilización en otros casos | `skills/`, `loops/`, `loops/evidencia/caso_demo_loop.json` |
| 6 | ElevenLabs y VizData (14) | Voz consulta y crea folios reales; panel con KPI y accesibilidad; vista móvil | `docs/03_elevenlabs.md`, `evidencias/P03/`, `evidencias/P13/`, `evidencias/pages/` |
| 7 | Guardrails (12) | P04–P10 | `evidencias/P06/`, `evidencias/P07/`, `evidencias/P10/`, `tests/pruebas.csv` |
| 8 | Tokenización y costos (10) | Registro por llamada, tarifas, resumen, proyecciones | `costos/costos.csv`, `costos/tarifas.csv`, `costos/resumen_costos.md` |
| 9 | Pruebas y reproducibilidad (7) | Matriz P01–P14 (14/14 aprobadas), README, limitaciones, declaración IA | `tests/pruebas.csv`, `README.md`, `docs/07_declaracion_uso_ia.md` |
| 10 | Defensa (5) | Demostración en vivo de 12 min y video de respaldo | Video de respaldo: https://youtu.be/zUujHnbc9gk |

## Casos de referencia

| Folio | Qué demuestra |
|---|---|
| PS-20261120-S745 | Caso completo aprobado a la primera |
| PS-20261120-EHU4 | Loop de calidad V1 → V2 (P11) |
| PS-20261120-BFKC | Detenido por presupuesto (P09) |
| PS-20261120-7LPN | Error controlado de API (P08) |
| PS-20261125-XYEL | Aprobación con doble clic sin duplicar (P10); consulta por voz (P03) |
| PS-20261125-U3JE | Creado por voz → 4 agentes → aprobado en Telegram (P03) |
