# Evidencia de loops (completa con tus ejecuciones reales)

Guarda aquí, con datos sanitizados (sin chat_id ni nombres):

1. `caso_demo_loop.json` — el `resultado_json` del caso creado con `#demo-loop`: `historial_versiones` (V1 devuelto → V2 aprobado), traza y costos.
2. `caso_reutilizacion.json` — un segundo caso distinto (otros productos) que use los mismos skills: demuestra reutilización.
3. `caso_presupuesto.json` — caso detenido por límite (P09).
4. Capturas de la ejecución en n8n (vista Executions) donde se vea el regreso de «Loop de calidad» a «A3 preparar».

La simulación local `node tests/simular_orquestador.js` reproduce estos comportamientos con un modelo simulado; sirve como prueba automática, **no** sustituye la evidencia con el modelo real.
