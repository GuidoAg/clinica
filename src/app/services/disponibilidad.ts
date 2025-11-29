import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { DisponibilidadVisual } from "../models/disponibilidadVisual";

interface DisponibilidadDB {
  dia_semana: number;
  habilitado: boolean;
  hora_inicio: string;
  hora_fin: string;
}

@Injectable({
  providedIn: "root",
})
export class Disponibilidad {
  private diasTotales = 7;

  /**
   * Trae la disponibilidad actual del especialista
   */
  async obtenerDisponibilidades(
    perfilId: number,
  ): Promise<DisponibilidadVisual[]> {
    const { data, error } = await Supabase.from("disponibilidades")
      .select("dia_semana, hora_inicio, hora_fin, habilitado")
      .eq("perfil_id", perfilId);

    if (error) {
      console.error(
        "[Supabase] Error al obtener disponibilidades:",
        error.message,
      );
      return [];
    }

    const dias: DisponibilidadVisual[] = [];

    for (let i = 1; i <= this.diasTotales; i++) {
      const match = data.find((d: DisponibilidadDB) => d.dia_semana === i);
      if (match) {
        dias.push({
          dia: i,
          habilitado: match.habilitado,
          horaDesde: match.hora_inicio,
          horaHasta: match.hora_fin,
        });
      } else {
        dias.push({
          dia: i,
          habilitado: false,
          horaDesde: "00:00",
          horaHasta: "00:00",
        });
      }
    }

    return dias;
  }

  /**
   * Guarda las disponibilidades (upsert)
   */
  async upsertDisponibilidades(
    perfilId: number,
    lista: DisponibilidadVisual[],
  ): Promise<boolean> {
    const rows = lista.map((d) => ({
      perfil_id: perfilId,
      dia_semana: d.dia,
      hora_inicio: d.horaDesde,
      hora_fin: d.horaHasta,
      habilitado: d.habilitado, // incluir habilitado explícitamente
    }));

    const { error } = await Supabase.from("disponibilidades").upsert(rows, {
      onConflict: "perfil_id,dia_semana",
    });

    if (error) {
      console.error(
        "[Supabase] Error al guardar disponibilidades:",
        error.message,
      );
      return false;
    }

    return true;
  }
}
