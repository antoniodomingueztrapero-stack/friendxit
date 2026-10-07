# Cómo publicar el juego y jugar con tus amigos

## Primero: por qué el enlace no le funcionó a nadie

La vista previa (la ventana que ves en esta conversación) es como **mi taller**: solo la ves tú desde aquí. Ese enlace no sirve para mandarlo ni para abrirlo en tu móvil. No es un fallo del juego.

Tu web de verdad ya existe: **https://gallery-game-creator.lovable.app** (la creó Lovable). Ahí sí puede entrar cualquiera. Lo que pasa es que ahora mismo tiene la versión antigua: tus mejoras están en mi rama, y para que lleguen a la web hay que hacer 3 cosas.

---

## Paso a paso para publicar

### 1. Aceptar los cambios en GitHub (1 minuto)

Abre este enlace:

**https://github.com/antoniodomingueztrapero-stack/friendxit/pull/1**

- Pulsa el botón verde **"Merge pull request"**.
- Luego pulsa **"Confirm merge"**.
- Ya está. Es como dar el visto bueno a una propuesta.

### 2. Entrar en Lovable (1 minuto)

Abre tu proyecto:

**https://lovable.dev/projects/2ae52a8d-39fa-4075-8ea6-3407c8e601ce**

- Los cambios aparecerán ahí solos (Lovable se sincroniza con GitHub).
- Si tardara, espera un momento o recarga la página.

### 3. Publicar (1 minuto)

- En la esquina superior derecha, pulsa el botón **Publish** (o **Update**, según cómo se vea).
- Espera un minuto mientras termina.

### 4. Comprobar que está publicado

- Abre **https://gallery-game-creator.lovable.app** en el móvil.
- Deberías ver la portada nueva: la cocina patas arriba y el papel cálido (si sigues viendo el fondo azul oscuro con dorado, es la versión vieja: recarga con fuerza o espera un par de minutos).

---

## Cómo probar una partida tú solo (sin depender de nadie)

El juego pide **3 jugadores** para empezar, así que necesitas tres "yo" distintos:

1. Abre la web en una ventana normal del ordenador → jugador 1.
2. Abre una **ventana de incógnito** → jugador 2 (el incógnito cuenta como persona distinta).
3. Abre otra ventana de incógnito (o usa el móvil) → jugador 3.
4. En una de ellas, crea la sala. En las otras, mete el código y entrad.
5. En el paso de crear la sala, elige **"Cada uno con sus fotos"** y sube 1 o 2 fotos en cada ventana: así pruebas una ronda entera en un par de minutos, sin tener que subir 18 fotos.
6. Juega una ronda y **mira sobre todo el momento de la revelación**: los votos que caen uno a uno, el redoble y el sello rojo.

Cuando ya quieras jugar en serio: crea la sala en modo **"Mazo común"**, manda el enlace **https://gallery-game-creator.lovable.app** (o solo el código de 5 letras) al grupo de WhatsApp, y que cada uno suba sus fotos.

---

## Si alguien sigue sin poder entrar

Dime **qué mensaje exacto le sale** (o mándame una captura). Hay una causa muy probable y fácil de arreglar: en Supabase puede estar desactivado el acceso como **invitado** (el botón "Entrar como invitado" sin crear cuenta). Si es eso, te doy el clic exacto que hay que dar en Supabase, son 30 segundos.

---

## Plan B (si algún día no quieres depender de Lovable)

El juego se puede publicar también en Netlify o Vercel conectando el repositorio de GitHub. Es un poco más de faena la primera vez, pero queda igual de bien y gratis. Dímelo y te lo preparo.
