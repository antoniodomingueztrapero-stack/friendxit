# Friendxit — fase 1: la cara nueva

*Resumen para leer en 2 minutos. Sin tecnicismos.*

## Qué hemos cambiado

| Antes | Ahora |
| --- | --- |
| Fondo azul noche con dorado brillante (pinta de web de empresa) | **Papel cálido de imprenta**, tinta oscura y colores de baraja: rojo teja para lo importante, mostaza para los detalles y verde teal para lo secundario |
| Letra elegante de revista (Fraunces) + letra neutra | Letra con carácter y desgarbada (**Bricolage Grotesque**) y una **letra de rotulador** para las frases divertidas |
| Bordes muy redondeados y sombras difusas, todo igual | Bordes gruesos de tinta y **sombra dura de sello** (como un cartel impreso). Los botones se "hunden" al pulsarlos |
| Portada con dibujo genérico de cartas flotando en el cielo | **La cocina patas arriba**: la abuela fotografiando al techo, un cable enredado, el gato en la ensaladera y el perro escapando con una carta |
| Portada con 4 tarjetitas técnicas ("3 a 10 jugadores", "puntos automáticos") | **Una ronda contada en 3 viñetas**, hechas con recortes de la propia ilustración |
| Logo con destello dorado | **Subrayado de rotulador** amarillo (el mismo en todas las pantallas) |
| Pantallas de error en inglés y SOSAS | En español, con la voz del juego ("Se ha caído la mesa") |
| El texto de la portada sonaba a folleto | Ahora habla como se habla en una partida ("el domingo por la tarde", "¿quién pica?", "¡era la del perro!") |

## Un fallo que había de antes, ya arreglado

Mientras jugabas, la banda con la pista del narrador **tenía preparado un reloj que no se veía nunca**. Ahora sí: mientras los demás eligen carta, ves cuánto queda. Y cuando quedan 10 segundos, el reloj se pone rojo.

## Cómo verlo

Recarga la vista previa y mira la portada, "Cómo se juega" y una sala de partida. Todo el juego cambia de color a la vez, porque los colores salen de un solo sitio.

## Lo que NO he tocado (todavía)

- La estructura de las pantallas dentro de la partida (sigue igual, solo cambia la ropa).
- Nada de la base de datos: **esta fase no necesitaba tu intervención**.
- La ilustración de portada pesa 350 KB. Se puede dejar en mucho menos sin que se note, cuando toque optimizar.

## Lo siguiente, por orden

1. **Emoción dentro de la partida**: un "¡Te toca ser el narrador!" que se vea de verdad, la revelación con suspense (de una en una) y **sonidos** (tic-tac, aplauso, "ohhh").
2. **Que nadie se caiga por el camino**: poder empezar a jugar sin subir fotos y añadirlas luego. Esta es la que más jugadores salva, pero **necesita un cambio en la base de datos**: te daré un texto para pegar en Supabase y un botón que pulsar (30 segundos tuyos).
3. **Fotos que se encojen solas** antes de subirse: hoy una foto de 5 MB tarda una eternidad desde el móvil.
4. **Revancha** desde el podio, sin volver a subir nada.
5. **Marca propia**: un símbolo para el juego y un **icono para la pantalla de inicio** del móvil, para que se pueda instalar como una app.
