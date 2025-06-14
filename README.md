# Control Ganadero

Para ejecutar el proyecto asegúrate de instalar las dependencias y compilar correctamente el módulo `sqlite3`.

```bash
npm install
```

Si estás usando una versión reciente de Node donde el binario precompilado de `sqlite3` no está disponible, el script `postinstall` recompilará el módulo automáticamente:

```bash
npm rebuild sqlite3 --build-from-source
```

Luego inicia el servidor:

```bash
npm start
```

La aplicación se servirá en `http://localhost:3000`.
