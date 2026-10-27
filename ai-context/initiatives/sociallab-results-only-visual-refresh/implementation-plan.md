# Implementation plan: interfaz centrada en resultados

## Cambios

1. Eliminar la barra superior del HTML.
2. Eliminar el campo de título y sus manejadores JavaScript.
3. Sustituir los tokens de color y los colores derivados de la matriz.
4. Retirar estilos que queden sin uso.
5. Validar sintaxis, pruebas Haskell y respuesta servida.
6. Publicar el cambio en el PR abierto hacia `DEV`.

## Criterios de aceptación

- No se muestra `SocialLab`, `Núcleo Haskell` ni el título editable del escenario.
- Se puede alternar entre dos equipos y tres parejas.
- Solo permanecen controles funcionales, resultados y datos.
- Los tres grupos tienen colores claramente diferenciables.
- La aplicación conserva las pruebas aprobadas.
