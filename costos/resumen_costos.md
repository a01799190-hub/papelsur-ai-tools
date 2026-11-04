# Resumen de costos — PapelSur

Fórmula por llamada: Cᵢ = (T_entrada × P_entrada + T_salida × P_salida) / 1 000 000

## Por etapa

| Etapa | Llamadas | Tokens entrada | Tokens salida | Costo USD |
|---|---|---|---|---|
| agente_1_recepcion | 5 | 2600 | 400 | 0.001250 |
| agente_2_catalogo | 4 | 3920 | 435 | 0.001633 |
| agente_3_cotizador | 5 | 5120 | 705 | 0.002338 |
| agente_4_revisor | 4 | 5150 | 235 | 0.001640 |
| voz_elevenlabs | 1 | 0 | 0 | 0.000000 |

## Por caso

| Caso | Estado | Costo LLM USD |
|---|---|---|
| PS-20261103-AB12 | aprobado | 0.001605 |
| PS-20261103-CD34 | aprobado | 0.001917 |
| PS-20261103-HK7Q | rechazado | 0.001540 |
| PS-20261103-VZ5M | aprobado | 0.001610 |
| PS-20261103-EF56 | bloqueado_politica | 0.000000 |
| PS-20261103-GH78 | requiere_aclaracion | 0.000188 |

- Casos completos: 4 · costo LLM promedio: **0.001668 USD/caso**
- Casos fallidos/rechazados por control: 2 · costo total: 0.000188 USD (se reporta aparte)
- Duración de voz promedio medida: 1.58 min (si no hay medición se usa 2 min como supuesto declarado)

## Proyección mensual

Supuestos: mezcla 70 % Telegram / 30 % voz; el escenario alto duplica tokens (más correcciones) y usa 4 min de voz.

| Casos/mes | Escenario | LLM USD | Minutos voz | Voz USD (sobre lo incluido) | Fijos USD | Total USD |
|---|---|---|---|---|---|---|
| 100 | base | 0.17 | 48 | 2.60 | 0.00 | 2.77 |
| 100 | alto | 0.33 | 120 | 8.40 | 0.00 | 8.73 |
| 1,000 | base | 1.67 | 475 | 36.80 | 0.00 | 38.47 |
| 1,000 | alto | 3.34 | 1,200 | 94.80 | 0.00 | 98.14 |
| 10,000 | base | 16.68 | 4,750 | 378.80 | 0.00 | 395.48 |
| 10,000 | alto | 33.36 | 12,000 | 958.80 | 0.00 | 992.16 |

Notas: el plan gratuito de Gemini no se extrapola como permanente (se usa la tarifa pagada). El LLM interno del agente de voz de ElevenLabs se cobra aparte y debe tomarse de su panel de uso.
Optimización aplicada: el Agente 4 no llama al modelo cuando la capa determinista ya encontró fallas; compara el costo de casos con y sin esta regla en tu informe.
