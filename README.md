# Control Ganadero

Esta versión incluye un servidor en Node.js para almacenar los datos de
inventario y sala de partos. Por defecto usa SQLite pero puede conectarse a una
base de datos PostgreSQL si se define la variable de entorno `DATABASE_URL`.

Para iniciar el proyecto de forma local:

```bash
npm install
node server.js
```

El servidor servirá los archivos estáticos y expondrá la API en `/api`. Abrir
`http://localhost:3000` en el navegador. Si despliegas la aplicación en un
servidor, ajusta el contenido de `<meta name="api-base">` en `index.html` para
apuntar al backend correspondiente.
