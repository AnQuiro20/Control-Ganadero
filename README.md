# Control Ganadero

Esta versión incluye un servidor en Node.js para almacenar los datos de
inventario y sala de partos. Por defecto usa SQLite pero puede conectarse a una
base de datos PostgreSQL si se define la variable de entorno `DATABASE_URL`.

Para iniciar el proyecto de forma local o desplegarlo, crea un archivo `.env` opcional con las variables que necesites.

```
DATABASE_URL=postgres://usuario:clave@host:puerto/base
API_BASE=https://midominio.com
HOST=0.0.0.0
PORT=3000
```

`DATABASE_URL` permite usar PostgreSQL en lugar de SQLite. `API_BASE` define la URL del backend que se insertará automáticamente en `index.html`. `HOST` y `PORT` controlan dónde escuchará el servidor; por defecto usan `0.0.0.0:3000` para aceptar conexiones desde cualquier dirección.

Luego instala dependencias y ejecuta el servidor:

```bash
npm install
node server.js
```

El servidor servirá los archivos estáticos y expondrá la API en `/api`. Abrir
`http://localhost:3000` en el navegador.

Si alojas los archivos estáticos en un dominio diferente al de la API,
establece `API_BASE` en tu `.env` (o directamente en `index.html`) con la URL
del backend para que las peticiones funcionen correctamente.
