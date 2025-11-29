import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";

@Injectable({
  providedIn: "root",
})
export class EspecialistaEspecialidad {
  /**
   * Trae las especialidades asignadas a un especialista con su duración
   */
  async obtenerEspecialidades(perfilId: number): Promise<
    {
      id: number;
      nombre: string;
      urlIcono?: string;
      duracion?: number;
    }[]
  > {
    const { data, error } = await Supabase.from("especialista_especialidades")
      .select(
        `
        especialidad_id:especialidad_id,
        duracion,
        especialidades (
          id,
          nombre,
          url_icono
        )
      `,
      )
      .eq("perfil_id", perfilId);

    if (error) {
      console.error(
        "[Supabase] Error al obtener especialidades:",
        error.message,
      );
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.especialidades.id,
      nombre: row.especialidades.nombre,
      urlIcono: row.especialidades.url_icono ?? undefined,
      duracion: row.duracion,
    }));
  }

  /**
   * Actualiza o inserta la duración de una especialidad para un especialista
   */
  async actualizarDuracion(
    especialidadId: number,
    perfilId: number,
    duracion: number,
  ): Promise<boolean> {
    const { error } = await Supabase.from("especialista_especialidades").upsert(
      [
        {
          especialidad_id: especialidadId,
          perfil_id: perfilId,
          duracion,
        },
      ],
      { onConflict: "perfil_id,especialidad_id" },
    );

    if (error) {
      console.error("[Supabase] Error al actualizar duración:", error.message);
      return false;
    }

    return true;
  }

  async agregarEspecialidad(
    perfilId: number,
    especialidadId: number,
  ): Promise<boolean> {
    const { error } = await Supabase.from("especialista_especialidades").upsert(
      [
        {
          perfil_id: perfilId,
          especialidad_id: especialidadId,
          duracion: 30,
        },
      ],
      { onConflict: "perfil_id,especialidad_id" },
    );

    if (error) {
      console.error(
        "[Supabase] Error al agregar especialidad al especialista:",
        error.message,
      );
      return false;
    }

    return true;
  }
}
