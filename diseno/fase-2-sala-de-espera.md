# Fase 2: la sala de espera (y la pantalla de crear partida)

*Lo que has visto en la captura: parecía un panel de empresa. Ya no.*

## Qué he quitado

Antes la misma información aparecía **cuatro veces**: "1 jugador", "faltan 2 para empezar", "comparte el código", "cuando estéis listos pulsa Empezar". Eso es lo que hacía que pareciera hecho por una máquina y que no se entendiera nada.

Fuera:

- El panel "Resumen de la sala" con sus tres cajitas, sus etiquetas en mayúsculas y su "Estado: En el vestíbulo".
- La frase "Mazo común: 0 fotos sin repartir · tú has aportado 0. Hacen falta 6 para empezar."
- "Todavía no tienes cartas: se reparten cuando el anfitrión empieza la partida."
- El título "Sala de espera" (redundante: ya sabes que estás esperando).
- La ficha del jugador arriba a la izquierda, que se solapaba con el panel.
- En la pantalla de crear partida: los párrafos de las opciones ("Todos aportan fotos a un mazo compartido. Al empezar, cada jugador recibe 6 cartas al azar y tras cada ronda se descarta la jugada…") y la jerga de "Pista (Fase 1) (s)".

## Qué hay ahora

**1. El código, enorme y en el centro.** Es lo primero que ves al entrar en la sala, con dos botones debajo: *Copiar código* e *Invitar* (que abre WhatsApp o lo que tengas). Con cinta adhesiva en las esquinas, para que parezca un cartel pegado.

**2. "En la mesa": quién ha entrado.** Cada jugador es una ficha con su avatar grande, su nombre y una etiqueta de **Anfitrión**. Los huecos libres salen punteados con un "+". De un vistazo sabes cuántos sois y cuántos faltan, sin leer una sola frase.

**3. "Tus fotos" con barra de progreso.** En vez de la frase larga: una barra que se va llenando (`4 / 24`), el botón *Aportar fotos* y una línea pequeña: "Tú has puesto 2. Con 24 fotos se reparten 6 cartas a cada uno."

**4. Un solo botón para empezar**, grande, abajo del todo. Cuando no se puede pulsar, te dice **por qué** en una línea: "Faltan 2 jugadores (mínimo 3)" o "Faltan fotos: hay 12 en el mazo y hacen falta 24". El botón se "hunde" al pulsarlo y el texto libre dice "Esperando a que [nombre] empiece la partida…".

**5. Crear partida, en dos columnas claras:** *Montar una sala* (a la izquierda) y *Tengo un código* (a la derecha, con un casillero enorme para escribir el código). Las opciones ahora se leen de un tirón: "Mazo común — Juntáis las fotos entre todos" / "Cada uno con sus fotos — Cada jugador juega con las fotos de su galería".

## Lo que no he tocado

- La partida en sí (rondas, votos, puntos).
- Nada de la base de datos: esta fase tampoco necesitaba tu intervención.

## Lo siguiente

La partida por dentro sigue con más texto del necesario y le falta emoción: el "¡Te toca ser el narrador!" a pantalla completa, la revelación con suspense y **sonidos**. Ahí es donde más se nota todavía la mano de la IA.
