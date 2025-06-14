# Control Ganadero

Esta versión incluye un servidor en Node.js para almacenar los datos de
inventario y sala de partos. Por defecto usa SQLite pero puede conectarse a una
base de datos MySQL si se definen las variables de entorno correspondientes.

Para iniciar el proyecto de forma local o desplegarlo, crea un archivo `.env` opcional con las variables que necesites.

```
MYSQL_HOST=localhost
MYSQL_USER=usuario
MYSQL_PASSWORD=clave
MYSQL_DATABASE=base
API_BASE=https://midominio.com
HOST=0.0.0.0
PORT=3000
```

Si se configuran estas variables de MySQL el servidor usará esa base de datos remota en lugar de SQLite. `API_BASE` define la URL del backend que se insertará automáticamente en `index.html`. `HOST` y `PORT` controlan dónde escuchará el servidor; por defecto usan `0.0.0.0:3000` para aceptar conexiones desde cualquier dirección.

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
