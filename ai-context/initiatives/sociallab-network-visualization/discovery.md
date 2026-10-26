# Discovery: visualización interactiva de redes

## Solicitud

Incorporar una red interactiva en la interfaz de SocialLab y reducir el contenido visual a controles, resultados y datos necesarios.

## Hallazgos

- La API ya entrega compatibilidades mutuas, asignaciones, utilidades y métricas; no se requiere modificar el backend.
- El escenario máximo tiene ocho personas, por lo que un SVG circular es suficiente y legible.
- Las tres soluciones relevantes ya existen: óptimo social, solución equitativa y mejor equilibrio de Nash.
- La interfaz actual contiene una introducción, definiciones, metodología y pie explicativo que pueden eliminarse sin perder funcionalidad.

## Solución

- Renderizar cada persona como nodo SVG.
- Colorear los nodos según el grupo asignado.
- Representar cada compatibilidad mutua como una arista cuya intensidad y grosor dependen de la puntuación.
- Permitir alternar entre las tres asignaciones relevantes.
- Permitir seleccionar un nodo para destacar sus conexiones, grupo, utilidad y compatibilidades principales.
- Conservar únicamente títulos, etiquetas, controles, métricas, desviaciones y datos.

## Alcance

La red será determinista, sin librerías externas ni simulación física. Esto mantiene la implementación fácil de explicar y evita dependencias visuales innecesarias.

