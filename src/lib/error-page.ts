export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Se ha caído la mesa — Friendxit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font: 16px/1.55 "Figtree", system-ui, -apple-system, sans-serif;
        background-color: #f8f2e4;
        background-image: radial-gradient(rgb(41 39 51 / 0.05) 1px, transparent 1px);
        background-size: 22px 22px;
        color: #292733;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
      }
      .card {
        max-width: 30rem;
        width: 100%;
        text-align: center;
        padding: 2.25rem;
        background: #fffdf8;
        border: 2px solid #292733;
        border-radius: 1.5rem;
        box-shadow: 6px 6px 0 #292733;
      }
      h1 { font-size: 1.5rem; margin: 0 0 0.6rem; letter-spacing: -0.01em; }
      p { color: #5b5560; margin: 0 0 1.75rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: 0.7rem 1.35rem;
        border-radius: 999px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        border: 2px solid #292733;
      }
      .primary { background: #c8552f; color: #fffdf8; box-shadow: 3px 3px 0 #292733; }
      .secondary { background: #fffdf8; color: #292733; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Se ha caído la mesa</h1>
      <p>Algo se ha roto por nuestra parte y no hemos podido cargar la página. Prueba a recargar o vuelve al inicio; las partidas guardadas siguen ahí.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Recargar</button>
        <a class="secondary" href="/">Ir al inicio</a>
      </div>
    </div>
  </body>
</html>`;
}
