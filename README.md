# Clinica

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Deploy a Firebase Hosting

Este proyecto está configurado para desplegar en Firebase Hosting usando la carpeta `dist/clinica/browser` como salida del build de Angular.

### Requisitos

- Firebase CLI instalado y autenticado
  - Instalación: `npm install -g firebase-tools`
  - Login: `firebase login`
- Proyecto configurado en `.firebaserc` (ya apunta a `clinica-7117e`)

### Desarrollo local

```powershell
npm start
```

Abrí `http://localhost:4200` para ver la app en desarrollo.

### Build de producción

```powershell
npm run build:prod
```

Esto genera el build optimizado en `dist/clinica/browser`.

### Deploy a producción

```powershell
npm run deploy
```

Esto ejecuta el build de producción y despliega a Firebase Hosting. URL de hosting:

- https://clinica-7117e.web.app

### Preview (canal temporal)

Si querés validar cambios sin tocar producción, usá un canal de preview (expira a los 7 días):

```powershell
npm run deploy:preview
```

La CLI devolverá una URL temporal para revisar y compartir.

Para nombrar el canal (por feature):

```powershell
npm run build:prod; firebase hosting:channel:deploy mi-feature --expires 7d
```

### Troubleshooting

- "El comando 'firebase' no se reconoce":
  - `npm install -g firebase-tools`; luego `firebase login`
- Cambios no reflejados por caché:
  - El build usa `outputHashing: all`, así que los navegadores deberían descargar archivos nuevos. Forzá refresh duro (Ctrl+F5) si fuera necesario.
- Error de proyecto Firebase:
  - Verificá `.firebaserc` y el comando `firebase projects:list` para confirmar el Project ID.
