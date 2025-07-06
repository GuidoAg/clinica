import { Usuario } from '../models/Auth/Usuario';

export function mapPerfilToUsuario(perfil: any, email: string): Usuario {
  return {
    id: perfil.id,
    auth_id: perfil.auth_id,
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    edad: perfil.edad,
    dni: perfil.dni,
    urlImagenPerfil: perfil.url_imagen_perfil ?? undefined,
    emailVerificado: perfil.email_verificado,
    rol: perfil.rol,
    email,

    // Paciente
    obraSocial: perfil.detalles_paciente?.obra_social ?? undefined,
    urlImagenFondo: perfil.url_imagen_fondo ?? undefined,

    // Especialista
    validadoAdmin: perfil.detalles_especialista?.validado_admin ?? undefined,
    activo: perfil.detalles_especialista?.activo ?? undefined,
    especialidades:
      perfil.especialista_especialidades?.map((e: any) => e.especialidades) ??
      [],
  };
}
