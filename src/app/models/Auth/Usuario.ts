export interface Usuario {
  id: number;
  auth_id: string;
  nombre: string;
  apellido: string;
  edad: string;
  dni: string;
  urlImagenPerfil?: string;
  emailVerificado: boolean;
  rol: "admin" | "paciente" | "especialista";

  email: string;

  obraSocial?: string;
  urlImagenFondo?: string;

  especialidades?: {
    id: number;
    nombre: string;
    urlIcono?: string;
    duracion?: number;
  }[];
  validadoAdmin?: boolean;
  activo?: boolean;
}
