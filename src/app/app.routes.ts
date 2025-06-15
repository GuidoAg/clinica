import { Routes } from '@angular/router';
import { WelcomeNavbar } from './components/welcome/welcome-navbar/welcome-navbar';

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
];
