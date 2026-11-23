# Resumen de costos — PapelSur

Fórmula por llamada: Cᵢ = (T_entrada × P_entrada + T_salida × P_salida) / 1 000 000

## Por etapa

| Etapa | Llamadas | Tokens entrada | Tokens salida | Costo USD |
|---|---|---|---|---|
| agente_1_recepcion | 10 | 3290 | 832 | 0.002070 |
| agente_2_catalogo | 5 | 2996 | 723 | 0.001834 |
| agente_3_cotizador | 7 | 3892 | 1779 | 0.003642 |
| agente_4_revisor | 6 | 5352 | 470 | 0.002043 |

## Por caso

| Caso | Estado | Costo LLM USD |
|---|---|---|
| PS-20261120-4Y8K | error | 0.000081 |
| PS-20261120-79NU | error | 0.000081 |
| PS-20261120-S745 | aprobado | 0.001545 |
| PS-20261120-BVZ2 | pendiente_aprobacion | 0.001989 |
| PS-20261120-HPFC | requiere_aclaracion | 0.000293 |
| PS-20261120-DWCF | rechazado | 0.001437 |
| PS-20261120-W3U6 | requiere_aclaracion | 0.000195 |
| PS-20261120-EHU4 | aprobado | 0.002419 |
| PS-20261120-7LPN | error | 0.000079 |
| PS-20261120-BFKC | detenido_presupuesto | 0.000000 |
| PS-20261120-6WLK | aprobado | 0.001470 |

- Casos completos: 4 · costo LLM promedio: **0.001718 USD/caso**
- Casos fallidos/rechazados por control: 7 · costo total: 0.002717 USD (se reporta aparte)
- Duración de voz promedio medida: 2.00 min (si no hay medición se usa 2 min como supuesto declarado)

## Proyección mensual

Supuestos: mezcla 70 % Telegram / 30 % voz; el escenario alto duplica tokens (más correcciones) y usa 4 min de voz.

| Casos/mes | Escenario | LLM USD | Minutos voz | Voz USD (sobre lo incluido) | Fijos USD | Total USD |
|---|---|---|---|---|---|---|
| 100 | base | 0.17 | 60 | 3.60 | 0.00 | 3.77 |
| 100 | alto | 0.34 | 120 | 8.40 | 0.00 | 8.74 |
| 1,000 | base | 1.72 | 600 | 46.80 | 0.00 | 48.52 |
| 1,000 | alto | 3.44 | 1,200 | 94.80 | 0.00 | 98.24 |
| 10,000 | base | 17.18 | 6,000 | 478.80 | 0.00 | 495.98 |
| 10,000 | alto | 34.36 | 12,000 | 958.80 | 0.00 | 993.16 |

Notas: el plan gratuito de Gemini no se extrapola como permanente (se usa la tarifa pagada). El LLM interno del agente de voz de ElevenLabs se cobra aparte y debe tomarse de su panel de uso.
Optimización aplicada: el Agente 4 no llama al modelo cuando la capa determinista ya encontró fallas; compara el costo de casos con y sin esta regla en tu informe.
