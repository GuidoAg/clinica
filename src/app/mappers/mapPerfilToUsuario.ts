// mappers/mapPerfilToUsuario.ts
import { Usuario } from '../models/Auth/Usuario';

export function mapPerfilToUsuario(perfil: any, email: string): Usuario {
  return {
    id: Number(perfil.id),
    auth_id: perfil.auth_id,
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    edad: String(perfil.edad),
    dni: perfil.dni,
    urlImagenPerfil: perfil.url_imagen_perfil ?? undefined,
    emailVerificado: perfil.email_verificado,
    rol: perfil.rol,
    email,

    // Sólo pacientes
    obraSocial: perfil.detalles_paciente?.obra_social ?? undefined,
    urlImagenFondo: perfil.detalles_paciente?.url_imagen_fondo ?? undefined,

    // Sólo especialistas
    validadoAdmin: perfil.detalles_especialista?.validado_admin,
    activo: perfil.detalles_especialista?.activo,
    especialidades:
      perfil.especialista_especialidades?.map((rel: any) => ({
        id: rel.especialidades.id,
        nombre: rel.especialidades.nombre,
        urlIcono: rel.especialidades.url_icono ?? undefined,
        duracion: rel.duracion ?? undefined,
      })) ?? [],
  };
}
