import { inject, Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import type { Usuario } from "../models/Auth/Usuario";
import { AuthSupabase } from "./auth-supabase";
import { TABLA, QUERY_VISTA_PERFILES_RELACIONES } from "../constantes";

@Injectable({
  providedIn: "root",
})
export class UsuariosService {
  private auth = inject(AuthSupabase);

  async obtenerTodosUsuarios(): Promise<Usuario[]> {
    const { data: perfiles, error } = await Supabase.from(
      TABLA.VISTA_PERFILES_CON_EMAIL,
    ).select(QUERY_VISTA_PERFILES_RELACIONES.COMPLETO_CON_RELACIONES);

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }

    return perfiles.map((p) => {
      const detallesPaciente = Array.isArray(p.detalles_paciente)
        ? p.detalles_paciente[0]
        : (p.detalles_paciente ?? null);

      const detallesEspecialista = Array.isArray(p.detalles_especialista)
        ? p.detalles_especialista[0]
        : (p.detalles_especialista ?? null);

      const especialidades = (p.especialista_especialidades ?? []).map((ee) => {
        const esp = Array.isArray(ee.especialidades)
          ? ee.especialidades[0]
          : ee.especialidades;

        return {
          id: esp?.id ?? 0,
          nombre: esp?.nombre ?? "",
          urlIcono: esp?.url_icono ?? undefined,
          duracion: ee.duracion,
        };
      });

      return {
        id: p.id,
        auth_id: p.auth_id,
        nombre: p.nombre,
        apellido: p.apellido,
        edad: String(p.edad),
        dni: p.dni,
        urlImagenPerfil: p.url_imagen_perfil,
        email: p.email ?? "",
        emailVerificado: p.email_verificado_real ?? false,
        rol: p.rol,
        activo: detallesEspecialista?.activo ?? true,
        validadoAdmin: detallesEspecialista?.validado_admin ?? false,
        obraSocial: detallesPaciente?.obra_social,
        urlImagenFondo: detallesPaciente?.url_imagen_fondo,
        especialidades,
      } as Usuario;
    });
  }

  /**
   * Versión optimizada que obtiene solo pacientes verificados
   * Mucho más rápido que obtener todos y filtrar
   */
  async obtenerPacientesVerificados(): Promise<Usuario[]> {
    const { data: perfiles, error } = await Supabase.from(
      TABLA.VISTA_PERFILES_CON_EMAIL,
    )
      .select(QUERY_VISTA_PERFILES_RELACIONES.PACIENTES_VERIFICADOS)
      .eq("rol", "paciente")
      .eq("email_verificado_real", true);

    if (error) {
      console.error("Error al obtener pacientes:", error);
      return [];
    }

    return perfiles.map((p) => {
      const detallesPaciente = Array.isArray(p.detalles_paciente)
        ? p.detalles_paciente[0]
        : (p.detalles_paciente ?? null);

      return {
        id: p.id,
        auth_id: p.auth_id,
        nombre: p.nombre,
        apellido: p.apellido,
        edad: String(p.edad),
        dni: p.dni,
        urlImagenPerfil: p.url_imagen_perfil,
        email: p.email ?? "",
        emailVerificado: true,
        rol: "paciente",
        activo: true,
        validadoAdmin: false,
        obraSocial: detallesPaciente?.obra_social,
        urlImagenFondo: detallesPaciente?.url_imagen_fondo,
        especialidades: [],
      } as Usuario;
    });
  }

  async actualizarEstadoEspecialista(
    perfilId: number,
    validadoAdmin: boolean,
  ): Promise<boolean> {
    const { error } = await Supabase.from(TABLA.DETALLES_ESPECIALISTA)
      .update({ validado_admin: validadoAdmin })
      .eq("perfil_id", perfilId);

    if (error) {
      console.error(
        "Error al actualizar validado_admin del especialista:",
        error,
      );
      return false;
    }

    return true;
  }
}
