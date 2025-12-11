export interface Perfil {
  id: string;
  authId: string;
  nombre: string;
  apellido: string;
  edad?: number;
  dni?: string;
  urlImagenPerfil?: string;
  emailVerificado: boolean;
  creadoEn: string;
  rol: "admin" | "paciente" | "especialista";
}
