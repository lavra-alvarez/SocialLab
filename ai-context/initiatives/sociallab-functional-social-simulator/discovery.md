# Discovery: SocialLab

## Estado

- Aprobado para implementación el 2026-10-26.
- Proyecto escolar independiente de repositorios laborales.
- Prioridad: entrega sólida, comprensible y reproducible sobre complejidad visual.

## Problema

Una calculadora de compatibilidad aislada no demuestra teoría de juegos y un buscador genérico de Nash sería difícil de presentar. SocialLab conecta ambas ideas con formación de grupos: las preferencias ponderadas producen utilidades y cada persona puede decidir si le conviene cambiar unilateralmente de grupo.

## Decisión central

El MVP utiliza grupos en lugar de parejas. En una pareja, la desviación normalmente requiere consentimiento mutuo y el concepto natural es una pareja bloqueante. En grupos, cambiar de grupo es una estrategia unilateral bien definida, por lo que el equilibrio de Nash puede comprobarse sin tergiversarlo.

## Modelo

- Rasgos, ideales y pesos por criterio.
- Afinidad dirigida de 0 a 100.
- Compatibilidad mutua como promedio de dos afinidades dirigidas.
- Utilidad como promedio de afinidades hacia compañeros de grupo.
- Utilidad de reserva cuando una persona queda sola.
- Bienestar como promedio colectivo.
- Equidad mediante mínimo y brecha de satisfacción.
- Nash puro cuando ninguna desviación unilateral produce una mejora estricta.

## Restricciones

- De 2 a 8 personas ficticias.
- Dos grupos.
- Enumeración exhaustiva de `2^n` perfiles.
- Sin persistencia, autenticación, datos reales ni aprendizaje automático.
- Backend y lógica evaluable en Haskell; interfaz estática sin framework.

## Arquitectura

- Núcleo Haskell puro y modular.
- Scotty y Aeson en el borde HTTP/JSON.
- HTML, CSS y JavaScript para la presentación.
- Cabal para compilación y pruebas.

