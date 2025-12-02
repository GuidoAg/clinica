import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EstadoCita } from "../enums/EstadoCita";
import {
  TABLA,
  QUERY_PERFILES,
  QUERY_ESPECIALIDADES,
  QUERY_REGISTRO_INGRESOS,
  QUERY_CITAS,
} from "../constantes";

interface CitaFechaDB {
  fecha_hora: string;
}
import {
  TurnosPorDia,
  TurnosPorMedico,
  TurnosPorEspecialidad,
  Ingreso,
  TrendLineData,
  IngresosPorHora,
} from "../models/Estadisticas/modeloEstadisticas";

@Injectable({ providedIn: "root" })
export class Estadisticas {
  async obtenerLogIngresos(): Promise<Ingreso[]> {
    const { data: ingresos, error } = await Supabase.from(
      TABLA.REGISTRO_INGRESOS,
    )
      .select(QUERY_REGISTRO_INGRESOS.BASICO)
      .order("fecha_ingreso", { ascending: false });

    if (error || !ingresos) {
      console.error(
        "[Supabase] Error al obtener log de ingresos:",
        error?.message,
      );
      return [];
    }

    const perfilIds = [
      ...new Set(ingresos.map((i) => i.perfil_id).filter(Boolean)),
    ];

    const { data: perfiles, error: errorPerfiles } = await Supabase.from(
      TABLA.PERFILES,
    )
      .select(QUERY_PERFILES.IDENTIFICACION)
      .in("id", perfilIds);

    if (errorPerfiles || !perfiles) {
      console.error(
        "[Supabase] Error al obtener perfiles:",
        errorPerfiles?.message,
      );
      return [];
    }

    return ingresos.map((i) => {
      const perfil = perfiles.find((p) => p.id === i.perfil_id);
      return {
        fecha: i.fecha_ingreso,
        nombre: perfil?.nombre ?? "Desconocido",
        apellido: perfil?.apellido ?? "",
        rol: perfil?.rol ?? "N/A",
      };
    });
  }

  async obtenerTurnosPorEspecialidad(): Promise<TurnosPorEspecialidad[]> {
    const { data: citas, error } = await Supabase.from(TABLA.CITAS).select(
      "especialidad_id",
    );

    if (error || !citas) {
      console.error(
        "[Supabase] Error al obtener turnos por especialidad:",
        error?.message,
      );
      return [];
    }

    const ids = [
      ...new Set(citas.map((c) => c.especialidad_id).filter(Boolean)),
    ];
    const { data: especialidades, error: errorEsp } = await Supabase.from(
      TABLA.ESPECIALIDADES,
    )
      .select(QUERY_ESPECIALIDADES.BASICO)
      .in("id", ids);

    if (errorEsp || !especialidades) {
      console.error(
        "[Supabase] Error al obtener especialidades:",
        errorEsp?.message,
      );
      return [];
    }

    const contador = new Map<number, number>();
    for (const cita of citas) {
      if (!cita.especialidad_id) continue;
      contador.set(
        cita.especialidad_id,
        (contador.get(cita.especialidad_id) ?? 0) + 1,
      );
    }

    return ids.map((id) => {
      const especialidad = especialidades.find((e) => e.id === id);
      return {
        especialidad: especialidad?.nombre ?? "Sin especialidad",
        cantidad: contador.get(id) ?? 0,
      };
    });
  }

  async obtenerTurnosPorDia(): Promise<TurnosPorDia[]> {
    const { data, error } = await Supabase.from(TABLA.CITAS).select(
      "fecha_hora",
    );

    if (error || !data) {
      console.error(
        "[Supabase] Error al obtener turnos por día:",
        error?.message,
      );
      return [];
    }

    const agrupado = new Map<string, number>();
    for (const cita of data as CitaFechaDB[]) {
      const fecha = new Date(cita.fecha_hora).toISOString().split("T")[0];
      agrupado.set(fecha, (agrupado.get(fecha) ?? 0) + 1);
    }

    return Array.from(agrupado.entries())
      .map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  async obtenerTurnosPorMedico(
    desde: string,
    hasta: string,
  ): Promise<TurnosPorMedico[]> {
    let query = Supabase.from(TABLA.CITAS).select("especialista_id");

    if (desde && hasta) {
      query = query.gte("fecha_hora", desde).lte("fecha_hora", hasta);
    }

    const { data: citas, error } = await query;

    if (error || !citas) {
      console.error(
        "[Supabase] Error al obtener turnos por médico:",
        error?.message,
      );
      return [];
    }

    const ids = [
      ...new Set(citas.map((c) => c.especialista_id).filter(Boolean)),
    ];
    const { data: perfiles, error: errorPerfiles } = await Supabase.from(
      TABLA.PERFILES,
    )
      .select(QUERY_PERFILES.NOMBRE_COMPLETO)
      .in("id", ids);

    if (errorPerfiles || !perfiles) {
      console.error(
        "[Supabase] Error al obtener perfiles:",
        errorPerfiles?.message,
      );
      return [];
    }

    const contador = new Map<number, number>();
    for (const cita of citas) {
      if (!cita.especialista_id) continue;
      contador.set(
        cita.especialista_id,
        (contador.get(cita.especialista_id) ?? 0) + 1,
      );
    }

    return ids.map((id) => {
      const perfil = perfiles.find((p) => p.id === id);
      return {
        nombre: perfil ? `${perfil.nombre} ${perfil.apellido}` : "Desconocido",
        cantidad: contador.get(id) ?? 0,
      };
    });
  }

  async obtenerTurnosFinalizadosPorMedico(
    desde: string,
    hasta: string,
  ): Promise<TurnosPorMedico[]> {
    let query = Supabase.from(TABLA.CITAS)
      .select("especialista_id, estado")
      .eq("estado", EstadoCita.COMPLETADO);

    if (desde && hasta) {
      query = query.gte("fecha_hora", desde).lte("fecha_hora", hasta);
    }

    const { data: citas, error } = await query;

    if (error || !citas) {
      console.error(
        "[Supabase] Error al obtener turnos finalizados por médico:",
        error?.message,
      );
      return [];
    }

    const ids = [
      ...new Set(citas.map((c) => c.especialista_id).filter(Boolean)),
    ];
    const { data: perfiles, error: errorPerfiles } = await Supabase.from(
      TABLA.PERFILES,
    )
      .select(QUERY_PERFILES.NOMBRE_COMPLETO)
      .in("id", ids);

    if (errorPerfiles || !perfiles) {
      console.error(
        "[Supabase] Error al obtener perfiles:",
        errorPerfiles?.message,
      );
      return [];
    }

    const contador = new Map<number, number>();
    for (const cita of citas) {
      if (!cita.especialista_id) continue;
      contador.set(
        cita.especialista_id,
        (contador.get(cita.especialista_id) ?? 0) + 1,
      );
    }

    return ids.map((id) => {
      const perfil = perfiles.find((p) => p.id === id);
      return {
        nombre: perfil ? `${perfil.nombre} ${perfil.apellido}` : "Desconocido",
        cantidad: contador.get(id) ?? 0,
      };
    });
  }

  async obtenerIngresosEspecialistas60Dias(): Promise<TrendLineData> {
    return this.obtenerIngresosPorRol("especialista");
  }

  async obtenerIngresosPacientes60Dias(): Promise<TrendLineData> {
    return this.obtenerIngresosPorRol("paciente");
  }

  private async obtenerIngresosPorRol(rol: string): Promise<TrendLineData> {
    const hace60Dias = new Date();
    hace60Dias.setDate(hace60Dias.getDate() - 60);
    const fechaInicio = hace60Dias.toISOString();

    const { data: ingresos, error } = await Supabase.from(
      TABLA.REGISTRO_INGRESOS,
    )
      .select(QUERY_REGISTRO_INGRESOS.BASICO)
      .gte("fecha_ingreso", fechaInicio)
      .order("fecha_ingreso", { ascending: true });

    if (error || !ingresos) {
      console.error(
        `[Supabase] Error al obtener ingresos de ${rol}:`,
        error?.message,
      );
      return { datos: [], maxY: 40 };
    }

    const perfilIds = [
      ...new Set(ingresos.map((i) => i.perfil_id).filter(Boolean)),
    ];

    if (perfilIds.length === 0) {
      return { datos: [], maxY: 40 };
    }

    const { data: perfiles, error: errorPerfiles } = await Supabase.from(
      TABLA.PERFILES,
    )
      .select("id, rol")
      .in("id", perfilIds)
      .eq("rol", rol);

    if (errorPerfiles || !perfiles) {
      console.error(
        `[Supabase] Error al obtener perfiles de ${rol}:`,
        errorPerfiles?.message,
      );
      return { datos: [], maxY: 40 };
    }

    const perfilesRol = new Set(perfiles.map((p) => p.id));

    const ingresosFiltrados = ingresos.filter((i) =>
      perfilesRol.has(i.perfil_id),
    );

    const agrupadoPorDia = new Map<string, number>();

    for (const ingreso of ingresosFiltrados) {
      const fecha = new Date(ingreso.fecha_ingreso);
      const diaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

      agrupadoPorDia.set(diaKey, (agrupadoPorDia.get(diaKey) ?? 0) + 1);
    }

    const datos: IngresosPorHora[] = Array.from(agrupadoPorDia.entries()).map(
      ([fecha_hora, cantidad]) => ({
        fecha_hora,
        cantidad,
      }),
    );

    const maxCantidad = Math.max(...datos.map((d) => d.cantidad), 0);
    const maxY = maxCantidad === 0 ? 40 : Math.ceil((maxCantidad + 1) / 5) * 5;

    return { datos, maxY };
  }
}
