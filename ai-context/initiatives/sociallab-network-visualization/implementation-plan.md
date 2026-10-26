# Implementation plan: visualización interactiva de redes

## Cambios

1. Eliminar bloques introductorios y explicativos.
2. Añadir panel de red con selector de solución.
3. Calcular posiciones circulares para los nodos.
4. Dibujar aristas con grosor proporcional a compatibilidad.
5. Colorear nodos por grupo y mostrar utilidad.
6. Añadir selección de persona y detalle compacto.
7. Ajustar diseño responsive.
8. Validar, actualizar documentación y publicar en el PR abierto hacia `DEV`.

## Criterios de aceptación

- La red utiliza exclusivamente datos de la respuesta Haskell.
- Cambiar la solución actualiza grupos, métricas y colores.
- Seleccionar una persona destaca sus conexiones.
- Recalcular preferencias vuelve a dibujar la red.
- La interfaz no contiene párrafos introductorios o metodológicos.
- Compilación, pruebas y revisión visual aprobadas.

