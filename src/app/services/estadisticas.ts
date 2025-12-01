import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EstadoCita } from "../enums/EstadoCita";

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
  /**
   * Log de ingresos al sistema
   */
  async obtenerLogIngresos(): Promise<Ingreso[]> {
    const { data: ingresos, error } = await Supabase.from("registro_ingresos")
      .select("fecha_ingreso, perfil_id")
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
      "perfiles",
    )
      .select("id, nombre, apellido, rol")
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

  /**
   * Cantidad de turnos por especialidad
   */
  async obtenerTurnosPorEspecialidad(): Promise<TurnosPorEspecialidad[]> {
    const { data: citas, error } =
      await Supabase.from("citas").select("especialidad_id");

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
      "especialidades",
    )
      .select("id, nombre")
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

  /**
   * Cantidad de turnos por día
   */
  async obtenerTurnosPorDia(): Promise<TurnosPorDia[]> {
    const { data, error } = await Supabase.from("citas").select("fecha_hora");

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

    return Array.from(agrupado.entries()).map(([fecha, cantidad]) => ({
      fecha,
      cantidad,
    }));
  }

  /**
   * Turnos solicitados por médico en un rango (o historial completo si no hay rango)
   */
  async obtenerTurnosPorMedico(
    desde: string,
    hasta: string,
  ): Promise<TurnosPorMedico[]> {
    let query = Supabase.from("citas").select("especialista_id");

    // Solo aplicar filtros si se proporcionan fechas
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
      "perfiles",
    )
      .select("id, nombre, apellido")
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

  /**
   * Turnos finalizados por médico en un rango (o historial completo si no hay rango)
   */
  async obtenerTurnosFinalizadosPorMedico(
    desde: string,
    hasta: string,
  ): Promise<TurnosPorMedico[]> {
    let query = Supabase.from("citas")
      .select("especialista_id, estado")
      .eq("estado", EstadoCita.COMPLETADO);

    // Solo aplicar filtros si se proporcionan fechas
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
      "perfiles",
    )
      .select("id, nombre, apellido")
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

  /**
   * Obtener ingresos de especialistas de los últimos 60 días, agrupados por día
   */
  async obtenerIngresosEspecialistas60Dias(): Promise<TrendLineData> {
    return this.obtenerIngresosPorRol("especialista");
  }

  /**
   * Obtener ingresos de pacientes de los últimos 60 días, agrupados por día
   */
  async obtenerIngresosPacientes60Dias(): Promise<TrendLineData> {
    return this.obtenerIngresosPorRol("paciente");
  }

  /**
   * Método privado para obtener ingresos por rol
   */
  private async obtenerIngresosPorRol(rol: string): Promise<TrendLineData> {
    // Calcular fecha de hace 60 días
    const hace60Dias = new Date();
    hace60Dias.setDate(hace60Dias.getDate() - 60);
    const fechaInicio = hace60Dias.toISOString();

    // Obtener ingresos de los últimos 60 días
    const { data: ingresos, error } = await Supabase.from("registro_ingresos")
      .select("fecha_ingreso, perfil_id")
      .gte("fecha_ingreso", fechaInicio)
      .order("fecha_ingreso", { ascending: true });

    if (error || !ingresos) {
      console.error(
        `[Supabase] Error al obtener ingresos de ${rol}:`,
        error?.message,
      );
      return { datos: [], maxY: 40 };
    }

    // Obtener los perfiles para filtrar por rol
    const perfilIds = [
      ...new Set(ingresos.map((i) => i.perfil_id).filter(Boolean)),
    ];

    if (perfilIds.length === 0) {
      return { datos: [], maxY: 40 };
    }

    const { data: perfiles, error: errorPerfiles } = await Supabase.from(
      "perfiles",
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

    // Filtrar ingresos solo del rol específico
    const ingresosFiltrados = ingresos.filter((i) =>
      perfilesRol.has(i.perfil_id),
    );

    // Agrupar por día
    const agrupadoPorDia = new Map<string, number>();

    for (const ingreso of ingresosFiltrados) {
      const fecha = new Date(ingreso.fecha_ingreso);
      // Formatear como "YYYY-MM-DD"
      const diaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

      agrupadoPorDia.set(diaKey, (agrupadoPorDia.get(diaKey) ?? 0) + 1);
    }

    // Convertir a array y ordenar
    const datos: IngresosPorHora[] = Array.from(agrupadoPorDia.entries()).map(
      ([fecha_hora, cantidad]) => ({
        fecha_hora,
        cantidad,
      }),
    );

    // Calcular maxY dinámico - redondear hacia arriba al próximo múltiplo de 5
    const maxCantidad = Math.max(...datos.map((d) => d.cantidad), 0);
    const maxY = maxCantidad === 0 ? 40 : Math.ceil((maxCantidad + 1) / 5) * 5;

    return { datos, maxY };
  }
}
