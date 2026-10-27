# Impact analysis: interfaz centrada en resultados

## Impacto funcional

- No cambia el contrato JSON ni el núcleo Haskell.
- El selector de modo, edición de preferencias y recálculo continúan disponibles.
- Se elimina únicamente información decorativa o sin efecto matemático.

## Impacto visual

- Mayor contraste entre los grupos A, B y C.
- Estados exitosos y errores conservan colores semánticos separados.
- Las animaciones existentes reutilizan la nueva paleta.
- La vista comienza directamente con estado, controles y resultados.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Confundir título de escenario con selector | Conservar el selector bajo la etiqueta `Formación` |
| Perder identidad del proyecto | Mantener el título de la pestaña y la documentación, no una cabecera visual |
| Contraste insuficiente | Colores oscuros para texto y superficies blancas con bordes visibles |
