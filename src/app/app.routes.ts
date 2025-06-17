import { Routes } from '@angular/router';
import { WelcomeNavbar } from './components/welcome/welcome-navbar/welcome-navbar';
import { HomeNavbar } from './components/inicio/home-navbar/home-navbar';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome-page',
    pathMatch: 'full',
  },
  {
    path: 'welcome-page',
    component: WelcomeNavbar,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/welcome/welcome-page/welcome-page').then(
            (m) => m.WelcomePage,
          ),
      },
      {
        path: 'preguntas',
        loadComponent: () =>
          import('./components/welcome/preguntas/preguntas').then(
            (m) => m.Preguntas,
          ),
      },
      {
        path: 'ubicaciones',
        loadComponent: () =>
          import('./components/welcome/ubicaciones/ubicaciones').then(
            (m) => m.Ubicaciones,
          ),
      },
      {
        path: 'comentarios',
        loadComponent: () =>
          import('./components/welcome/comentarios/comentarios').then(
            (m) => m.Comentarios,
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./components/welcome/login/login').then((m) => m.Login),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./components/welcome/register/register').then(
            (m) => m.Register,
          ),
      },
    ],
  },
  {
    path: 'home',
    component: HomeNavbar,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/inicio/home/home').then((m) => m.Home),
      },
      {
        path: 'mi-perfil',
        loadComponent: () =>
          import('./components/inicio/mi-perfil/mi-perfil').then(
            (m) => m.MiPerfil,
          ),
      },
      {
        path: 'mis-turnos',
        loadComponent: () =>
          import('./components/inicio/mis-turnos/mis-turnos').then(
            (m) => m.MisTurnos,
          ),
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./components/inicio/turnos/turnos').then((m) => m.Turnos),
      },
      {
        path: 'solicitar-turnos',
        loadComponent: () =>
          import('./components/inicio/solicitar-turno/solicitar-turno').then(
            (m) => m.SolicitarTurno,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./components/inicio/usuarios/usuarios').then(
            (m) => m.Usuarios,
          ),
      },
    ],
  },
];
