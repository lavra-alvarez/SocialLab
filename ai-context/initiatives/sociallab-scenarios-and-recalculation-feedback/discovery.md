# Discovery: escenarios y retroalimentación del recálculo

## Estado

- Aprobado e implementado el 2026-10-27.
- Versión objetivo: `0.2.0.0`.

## Hallazgos

- El escenario actual ya contiene seis personas.
- El núcleo usa funciones puras, tipos algebraicos, `map`, `filter`, comprensiones de listas y transformaciones inmutables, por lo que coincide con los temas trabajados en clase.
- `Aeson`, `Scotty`, `Map`, `Set` y la serialización genérica son infraestructura más avanzada que los ejemplos del profesor. Deben mantenerse aislados de la explicación principal.
- El escenario actual analiza dos grupos mediante cambios unilaterales; esa regla sí permite comprobar equilibrio de Nash puro.
- Tres parejas exactas constituyen un problema de matching. Cambiar unilateralmente de pareja rompe la asignación, por lo que su criterio natural es la ausencia de una pareja bloqueante, no el equilibrio de Nash usado para equipos.
- La red actual dibuja todas las compatibilidades, pero no distingue visualmente las relaciones activas de la asignación. Al recalcular reemplaza todo el SVG y no compara el resultado anterior con el nuevo.

## Decisión propuesta

Mantener las mismas seis personas y ofrecer dos escenarios:

1. `Dos equipos`: dos grupos no vacíos, utilidad promedio dentro del equipo y estabilidad de Nash por cambios unilaterales válidos.
2. `Tres parejas`: tres grupos de dos personas, enumeración de los 15 matchings perfectos y estabilidad por parejas bloqueantes.

La interfaz mostrará únicamente selectores, métricas y resultados. No agregará párrafos explicativos.

## Alternativas descartadas

- Llamar “tres parejas” a tres grupos sin restricción de tamaño: la salida podría producir personas solas o grupos de tres.
- Exigir parejas exactas y reutilizar la desviación unilateral actual: toda desviación rompería la restricción y el análisis de Nash sería trivial.
- Reescribir todo el núcleo con listas simples: acercaría la sintaxis a los primeros ejercicios, pero aumentaría el riesgo sin mejorar el modelo. Es preferible simplificar solo las funciones que se mostrarán durante la exposición.

## Retroalimentación visual propuesta

- Conservar en segundo plano todas las aristas de compatibilidad.
- Superponer aristas activas: conexiones dentro del equipo o vínculo de cada pareja.
- Tras recalcular, una conexión nueva se traza y emite un resplandor breve; una conexión eliminada destella y se desvanece; una conexión sin cambios transiciona suavemente.
- Hacer pulsar el contorno de las personas cuya asignación cambió.
- Respetar `prefers-reduced-motion`.
