# Impact analysis: escenarios y retroalimentación del recálculo

## Complejidad

El cambio es de complejidad media y cabe en el alcance del proyecto. No requiere nuevas bibliotecas ni modificar la fórmula de compatibilidad.

## Backend Haskell

- Incorporar un tipo algebraico para distinguir equipos de parejas.
- Generar asignaciones válidas según el modo.
- Conservar el análisis de Nash para equipos.
- Agregar detección de parejas bloqueantes para matching.
- Validar seis personas, dos equipos no vacíos o tres parejas exactas.
- Exponer los dos escenarios desde la API.

## Interfaz

- Agregar un selector de escenario.
- Cambiar etiquetas y métricas de estabilidad según el modo.
- Mantener seis nodos y reutilizar el SVG actual.
- Comparar la asignación visible anterior con la nueva para clasificar aristas agregadas, eliminadas y conservadas.
- No agregar texto explicativo permanente.

## Pruebas necesarias

- El escenario de equipos genera únicamente grupos no vacíos.
- Se generan exactamente 15 matchings perfectos para seis personas.
- Cada persona aparece una sola vez y cada pareja tiene dos integrantes.
- Una asignación estable de parejas no contiene parejas bloqueantes.
- Los resultados óptimo y equitativo pertenecen al conjunto de asignaciones válidas.
- Los cambios de escenario conservan una respuesta JSON válida.
- La animación no altera los valores ni impide recalcular repetidamente.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Confundir Nash con estabilidad de matching | Etiquetas y algoritmos separados por modo |
| Duplicar parejas por etiquetas A/B/C | Generador canónico de matchings perfectos |
| Animar líneas sin cambio real | Comparar conjuntos de conexiones activas antes y después |
| Hacer el código demasiado avanzado | Mantener el núcleo puro y acompañar las funciones principales con tipos y comentarios breves |
| Sobrecargar la presentación | Un selector, la misma red y sin texto explicativo adicional |

## Estimación

- Modelo y generadores: 1 a 1.5 horas.
- Estabilidad y pruebas Haskell: 1 a 1.5 horas.
- API y selector visual: 1 hora.
- Transiciones de la red: 1 hora.
- Verificación, documentación y PR: 1 hora.

Total estimado: 5 a 6 horas de trabajo concentrado.
