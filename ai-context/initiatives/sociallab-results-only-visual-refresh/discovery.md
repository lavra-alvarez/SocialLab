# Discovery: interfaz centrada en resultados

## Estado

- Aprobado e implementado el 2026-10-27.

## Hallazgos

- El título editable del escenario solo cambia una cadena enviada al backend; no altera compatibilidad, utilidad, asignaciones ni estabilidad.
- El selector de formación sí cambia el algoritmo entre equipos y parejas, por lo que debe conservarse.
- La barra con el nombre del proyecto y la etiqueta tecnológica ocupa espacio sin aportar datos al experimento.
- La paleta anterior es sobria, pero distingue poco los tres grupos y las transiciones de la red.

## Decisión

- Retirar el título editable del escenario.
- Retirar por completo la barra superior.
- Conservar controles funcionales, métricas, red, asignaciones y matriz.
- Usar índigo, coral y turquesa para grupos y relaciones sobre superficies claras.
