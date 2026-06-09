# Encuesta RCP - formulario HTML y Google Sheets

Este proyecto contiene un formulario web en HTML/CSS/JavaScript vanilla y un backend en Google Apps Script para guardar respuestas en la planilla:

`https://docs.google.com/spreadsheets/d/1Z9JrIoQhpJI_GnhBGElXf_72cyBgPb4k2IVxUcNOliY/edit`

## Archivos

- `index.html`: formulario de encuesta por pantallas.
- `styles.css`: estilos visuales y fondo ECG animado.
- `app.js`: navegacion, validacion, bifurcaciones y envio.
- `google-apps-script/Code.gs`: script para crear hojas, diccionario de variables y recibir respuestas.
- `encuesta_original.docx`: copia local del documento fuente.

## Como conectar Google Sheets

1. Abrir la Google Sheet.
2. Ir a `Extensiones > Apps Script`.
3. Pegar todo el contenido de `google-apps-script/Code.gs` en `Code.gs`.
4. Guardar el proyecto.
5. Ejecutar una vez la funcion `setupSurveySheet`.
6. Autorizar los permisos que pida Google.
7. Verificar que se hayan creado o actualizado las hojas `respuestas` y `diccionario_variables`.

## Como publicar el endpoint

La URL actual configurada en `app.js` es:

`https://script.google.com/macros/s/AKfycbzhS-W4DoqS8Cu0eHW3ZScEhLnLuPxVNzS_ECrl0OJTJmOBO-nJcMEcJOKoiClzZraLRA/exec`

Si se crea una nueva implementacion en Apps Script, reemplazar esa URL en `app.js`.

1. En Apps Script, ir a `Implementar > Nueva implementacion`.
2. Elegir tipo `Aplicacion web`.
3. Configurar:
   - Ejecutar como: `Yo`.
   - Quien tiene acceso: `Cualquier usuario`.
4. Implementar y copiar la URL del Web App.
5. Abrir `app.js` y reemplazar `APPS_SCRIPT_URL` si la URL cambio.

## Como probar localmente

Abrir `index.html` en el navegador. Antes de enviar respuestas reales, completar una prueba y confirmar que aparece una nueva fila en la hoja `respuestas`.

## Cargar respuestas sinteticas de prueba

Para cargar ejemplos en la Google Sheet y revisar si la base queda procesable:

```powershell
& 'C:\Users\docto\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\seed-test-responses.cjs 30
```

Las filas de prueba quedan marcadas con `user_agent` que empieza con `Codex synthetic batch example`. Usar ese texto como filtro si luego se quieren borrar.

## Logica de datos

- Si `q06_realizo_rcp_comunidad = 0`, todas las columnas desde `q07` hasta `q21` se guardan como `NA`.
- Si `q10_utilizo_dea = 1`, `q11_motivo_no_dea` y `q11_motivo_no_dea_otro` se guardan como `NA`.
- Si `q10_utilizo_dea = 0`, `q12_resultado_dea` se guarda como `NA`.
- La pregunta 15 se guarda en la columna principal `q15_finalizacion_rcp`: 0 otra, 1 arribo del SEM, 2 RCE, 3 agotamiento fisico, 4 escena insegura, 5 suspension sin RCE, `NA` si no corresponde.

## Opciones gratuitas de alojamiento

La opcion mas simple con Git es GitHub Pages:

1. Inicializar un repositorio Git.
2. Subir `index.html`, `styles.css` y `app.js`.
3. Activar `Settings > Pages`.
4. Elegir la rama principal y carpeta raiz.

Tambien se puede usar Netlify, Cloudflare Pages o Vercel subiendo estos mismos archivos estaticos.
