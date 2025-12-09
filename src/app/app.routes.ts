import { Routes } from "@angular/router";
import { WelcomeNavbar } from "./components/welcome/welcome-navbar/welcome-navbar";
import { HomeNavbar } from "./components/inicio/home-navbar/home-navbar";
import { authGuard } from "./guards/auth-guard";
import { AdminGuard } from "./guards/auth-admin";
import { EspecialistaGuard } from "./guards/auth-especialista";
import { PacienteGuard } from "./guards/auth-paciente";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "welcome-page",
    pathMatch: "full",
  },
  {
    path: "welcome-page",
    component: WelcomeNavbar,
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./components/welcome/welcome-page/welcome-page").then(
            (m) => m.WelcomePage,
          ),
      },
      {
        path: "preguntas",
        loadComponent: () =>
          import("./components/welcome/preguntas/preguntas").then(
            (m) => m.Preguntas,
          ),
      },
      {
        path: "ubicaciones",
        loadComponent: () =>
          import("./components/welcome/ubicaciones/ubicaciones").then(
            (m) => m.Ubicaciones,
          ),
      },
      {
        path: "comentarios",
        loadComponent: () =>
          import("./components/welcome/comentarios/comentarios").then(
            (m) => m.Comentarios,
          ),
      },
      {
        path: "planes",
        loadComponent: () =>
          import("./components/welcome/planes/planes").then((m) => m.Planes),
      },
      {
        path: "login",
        loadComponent: () =>
          import("./components/welcome/login/login").then((m) => m.Login),
      },
      {
        path: "registro",
        loadComponent: () =>
          import("./components/welcome/register/register").then(
            (m) => m.Register,
          ),
      },
      {
        path: "confirmacion",
        loadComponent: () =>
          import("./components/welcome/confirmacion/confirmacion").then(
            (m) => m.Confirmacion,
          ),
      },
    ],
  },
  {
    path: "home",
    canActivate: [authGuard],
    component: HomeNavbar,
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./components/inicio/home-router/home-router").then(
            (m) => m.HomeRouter,
          ),
      },
      {
        path: "perfil-paciente",
        loadComponent: () =>
          import(
            "./components/inicio/perfil/perfil-paciente/perfil-paciente"
          ).then((m) => m.PerfilPaciente),
        canActivate: [PacienteGuard],
      },
      {
        path: "perfil-especialista",
        loadComponent: () =>
          import(
            "./components/inicio/perfil/perfil-especialista/perfil-especialista"
          ).then((m) => m.PerfilEspecialista),
        canActivate: [EspecialistaGuard],
      },
      {
        path: "perfil-admin",
        loadComponent: () =>
          import("./components/inicio/perfil/perfil-admin/perfil-admin").then(
            (m) => m.PerfilAdmin,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: "tabla-turnos",
        loadComponent: () =>
          import("./components/inicio/tabla-turnos/tabla-turnos").then(
            (m) => m.TablaTurnos,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: "mis-turnos-paciente",
        loadComponent: () =>
          import(
            "./components/inicio/mis-turnos-paciente/mis-turnos-paciente"
          ).then((m) => m.MisTurnosPaciente),
        canActivate: [PacienteGuard],
      },
      {
        path: "mis-turnos-especialista",
        loadComponent: () =>
          import(
            "./components/inicio/mis-turnos-especialista/mis-turnos-especialista"
          ).then((m) => m.MisTurnosEspecialista),
        canActivate: [EspecialistaGuard],
      },
      {
        path: "solicitar-turnos",
        loadComponent: () =>
          import("./components/inicio/solicitar-turno/solicitar-turno").then(
            (m) => m.SolicitarTurno,
          ),
        canActivate: [PacienteGuard],
      },
      {
        path: "solicitar-turnos-admin",
        loadComponent: () =>
          import(
            "./components/inicio/solicitar-turno-admin/solicitar-turno-admin"
          ).then((m) => m.SolicitarTurnoAdmin),
        canActivate: [AdminGuard],
      },
      {
        path: "pacientes",
        loadComponent: () =>
          import("./components/inicio/pacientes/pacientes").then(
            (m) => m.Pacientes,
          ),
        canActivate: [EspecialistaGuard],
      },
      {
        path: "usuarios",
        loadComponent: () =>
          import("./components/inicio/usuarios/usuarios").then(
            (m) => m.Usuarios,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: "encuestas",
        loadComponent: () =>
          import("./components/inicio/encuestas/encuestas").then(
            (m) => m.Encuestas,
          ),
        canActivate: [AdminGuard],
      },
    ],
  },
];
