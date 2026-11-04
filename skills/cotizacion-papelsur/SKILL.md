---
name: cotizacion-papelsur
version: 1.1.0
description: Prepara la redacción de una cotización de PapelSur (empresa ficticia) usando solo el catálogo autorizado y el cálculo determinista del servidor. Se activa cuando el orquestador invoca al Agente 3 con líneas ya verificadas.
---

# Skill de negocio: Cotización PapelSur

- **Versión:** 1.1.0 (1.0.0 no exigía supuestos explícitos; ver `loops/evidencia/`)
- **Activador:** el orquestador llega al paso A3 con `s.a2.lineas` no vacías.
- **Objetivo:** que el cliente reciba una propuesta clara, con números del servidor y supuestos explícitos.
- **Entradas:** `calculo` (detalle, subtotal, descuento, envío, IVA, total), `partidas` de A1, `advertencias` de existencias, `correcciones` de A4.
- **Fuentes permitidas:** `web/data/catalogo.json` (versión registrada en la traza) y `politica_comercial v1.0` (en `n8n/src/lib_reglas.js`).
- **Herramientas permitidas:** ninguna además del modelo; el cálculo lo hace la función `calcularCotizacion`.
- **Cómo se carga:** el nodo «Adaptador skills + catálogo» descarga este archivo desde GitHub Pages, lee `version` y la sección «Reglas» y las inserta en el prompt de A3. La traza registra `skill cotizacion-papelsur v1.1.0 cargado`.

## Reglas
1. No modifiques ningún número del cálculo; cítalos tal cual en MXN.
2. El resumen menciona cada producto cotizado con su cantidad y el total con IVA.
3. Incluye al menos dos supuestos explícitos: (a) vigencia de 7 días naturales y (b) disponibilidad sujeta a existencias del catálogo; agrega uno por cada advertencia de existencias.
4. Indica que es un RESULTADO SIMULADO de una empresa ficticia.
5. Condiciones permitidas: precios en MXN con IVA desglosado, envío gratis desde 3 000 MXN de subtotal, entrega a confirmar. Prohibido ofrecer crédito, plazos de pago o garantías.
6. Si hay correcciones del revisor, aplícalas todas y no repitas el error.
7. Sin nombres, correos ni teléfonos.

## Pasos
1. Leer el cálculo y las advertencias. 2. Redactar resumen (40–900 caracteres). 3. Listar supuestos y condiciones. 4. Devolver JSON `{resumen, supuestos[], condiciones[]}`.

## Límites
Máximo 600 tokens de salida por llamada; máximo 3 versiones por caso (loop de calidad).

## Salidas
JSON con `resumen`, `supuestos` (≥ 2), `condiciones`. El servidor agrega números, etiqueta, vigencia y fuentes.

## Errores
- JSON inválido → A4 lo devuelve («resumen fuera de longitud»/«faltan supuestos»).
- Líneas vacías → el skill no se activa; el orquestador cierra en `sin_coincidencias`.

## Criterios de aceptación
- `verificarPropuesta` sin fallas y dictamen `aprobado` del Agente 4.

## Ejemplos
- Válido: `ejemplos/valido.json` (40 cajas de hojas carta y 30 paquetes de bolígrafos azules).
- Debe pedir aclaración/rechazarse: `ejemplos/rechazo.json` (pide «papelería variada» sin cantidades y ofrece «pago a 60 días»).
