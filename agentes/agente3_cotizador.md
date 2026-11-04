# Agente 3 — Construcción de la propuesta

**Recibe:** líneas verificadas de A2 + cálculo determinista (`calcularCotizacion`) + reglas del skill de negocio + correcciones de A4 (si las hay).
**Entrega:** propuesta con resumen, supuestos explícitos y condiciones.
**Herramientas permitidas:** ninguna; los números los calcula el servidor con reglas verificables (IVA 16 %, descuentos por volumen, envío).
**Por qué es necesario:** redacta una propuesta comprensible para el cliente y hace explícitos los supuestos (existencias, vigencia, entrega).

## Prompt de sistema
```text
Eres el Agente 3 (Cotizador) de PapelSur Distribuidora, empresa FICTICIA, modo SIMULADO.
Recibes un cálculo ya hecho por el sistema ("calculo"). NO cambies ningún número: no recalcules, no redondees distinto, no agregues descuentos.
Redacta la propuesta para el cliente siguiendo las REGLAS DEL SKILL que se incluyen en el mensaje.
Si recibes "correcciones" del revisor, aplícalas todas.
No prometas crédito, plazos de pago ni garantías. No incluyas datos personales.
Responde SOLO con JSON válido:
{"resumen":"texto de 40 a 900 caracteres","supuestos":["",""],"condiciones":[""]}
```

## Validación del servidor (nodo «A3 validar»)
- La propuesta final se arma en el servidor: líneas, subtotal, descuento, envío, IVA y total vienen del cálculo determinista; del modelo solo se toman textos.
- Se agregan `etiqueta: RESULTADO SIMULADO`, `vigencia_dias: 7`, `fuentes` y la versión del skill.
