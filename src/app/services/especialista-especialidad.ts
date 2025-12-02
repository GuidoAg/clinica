import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { TABLA } from "../constantes";

@Injectable({
  providedIn: "root",
})
export class EspecialistaEspecialidad {
  async obtenerEspecialidades(perfilId: number): Promise<
    {
      id: number;
      nombre: string;
      urlIcono?: string;
      duracion?: number;
    }[]
  > {
    const { data, error } = await Supabase.from(
      TABLA.ESPECIALISTA_ESPECIALIDADES,
    )
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

    return (data || []).map((row: any) => ({
      id: row.especialidades.id,
      nombre: row.especialidades.nombre,
      urlIcono: row.especialidades.url_icono ?? undefined,
      duracion: row.duracion,
    }));
  }

  async actualizarDuracion(
    especialidadId: number,
    perfilId: number,
    duracion: number,
  ): Promise<boolean> {
    const { error } = await Supabase.from(
      TABLA.ESPECIALISTA_ESPECIALIDADES,
    ).upsert(
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
    const { error } = await Supabase.from(
      TABLA.ESPECIALISTA_ESPECIALIDADES,
    ).upsert(
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
