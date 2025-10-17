import { inject, Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import type { Usuario } from "../models/Auth/Usuario";
import { AuthSupabase } from "./auth-supabase";

@Injectable({
  providedIn: "root",
})
export class UsuariosService {
  private auth = inject(AuthSupabase);

  async obtenerTodosUsuarios(): Promise<Usuario[]> {
    const { data: perfiles, error } = await Supabase.from(
      "vista_perfiles_con_email",
    ).select(`
      id,
      auth_id,
      nombre,
      apellido,
      edad,
      dni,
      url_imagen_perfil, 
      rol,
      email,
      email_verificado_real,
      detalles_paciente (
        obra_social,
        url_imagen_fondo
      ),
      detalles_especialista (
        validado_admin,
        activo
      ),
      especialista_especialidades (
        duracion,
        especialidades (
          id,
          nombre,
          url_icono
        )
      )
    `);

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

  async actualizarEstadoEspecialista(
    perfilId: number,
    validadoAdmin: boolean,
  ): Promise<boolean> {
    const { error } = await Supabase.from("detalles_especialista")
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
