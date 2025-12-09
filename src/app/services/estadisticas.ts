import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EstadoCita } from "../enums/EstadoCita";
import {
  TABLA,
  QUERY_ESPECIALIDADES,
  QUERY_REGISTRO_INGRESOS,
} from "../constantes";

import {
  TurnosPorDia,
  TurnosPorMedico,
  TurnosPorEspecialidad,
  PacientesPorEspecialidad,
  MedicosPorEspecialidad,
  CitasPorEstado,
  Paciente,
  Ingreso,
  TrendLineData,
  IngresosPorHora,
} from "../models/Estadisticas/modeloEstadisticas";

@Injectable({ providedIn: "root" })
export class Estadisticas {
  // Cache de datos precargados
  private datosCache?: {
    citas: {
      especialidad_id: number | null;
      paciente_id: number | null;
      especialista_id: number | null;
      estado: string;
      fecha_hora: string;
    }[];
    especialidades: { id: number; nombre: string }[];
    relacionesEspecialistas: {
      especialidad_id: number | null;
      perfil_id: number | null;
    }[];
    perfilesMedicos: { id: number; nombre: string; apellido: string }[];
    perfilesCompletos: {
      id: number;
      nombre: string;
      apellido: string;
      rol: string;
    }[];
  };
  private datosCacheTimestamp?: number;
  private readonly CACHE_DURATION_MS = 3 * 60 * 1000;

  /**
   * Precarga todos los datos necesarios para las estadísticas en una sola consulta por tabla.
   * Esto optimiza el rendimiento al reducir múltiples llamadas a la base de datos.
   */
  async precargarDatosEstadisticas(): Promise<void> {
    const ahora = Date.now();

    // Usar cache si es válido
    if (
      this.datosCache &&
      this.datosCacheTimestamp &&
      ahora - this.datosCacheTimestamp < this.CACHE_DURATION_MS
    ) {
      return;
    }

    // Hacer todas las consultas en paralelo
    const [
      citasResult,
      especialidadesResult,
      relacionesResult,
      perfilesResult,
    ] = await Promise.all([
      Supabase.from(TABLA.CITAS).select(
        "especialidad_id, paciente_id, especialista_id, estado, fecha_hora",
      ),
      Supabase.from(TABLA.ESPECIALIDADES).select(QUERY_ESPECIALIDADES.BASICO),
      Supabase.from(TABLA.ESPECIALISTA_ESPECIALIDADES).select(
        "especialidad_id, perfil_id",
      ),
      Supabase.from(TABLA.PERFILES).select("id, nombre, apellido, rol"),
    ]);

    if (citasResult.error || !citasResult.data) {
      console.error(
        "[Supabase] Error al precargar citas:",
        citasResult.error?.message,
      );
      return;
    }

    if (especialidadesResult.error || !especialidadesResult.data) {
      console.error(
        "[Supabase] Error al precargar especialidades:",
        especialidadesResult.error?.message,
      );
      return;
    }

    if (relacionesResult.error || !relacionesResult.data) {
      console.error(
        "[Supabase] Error al precargar relaciones especialistas:",
        relacionesResult.error?.message,
      );
      return;
    }

    if (perfilesResult.error || !perfilesResult.data) {
      console.error(
        "[Supabase] Error al precargar perfiles:",
        perfilesResult.error?.message,
      );
      return;
    }

    // Filtrar solo los especialistas para perfilesMedicos
    const especialistaIds: number[] = [
      ...new Set(
        citasResult.data
          .map((c) => c.especialista_id)
          .filter((id): id is number => id !== null),
      ),
    ];

    const perfilesMedicos = perfilesResult.data.filter((p) =>
      especialistaIds.includes(p.id),
    );

    // Guardar en cache
    this.datosCache = {
      citas: citasResult.data,
      especialidades: especialidadesResult.data,
      relacionesEspecialistas: relacionesResult.data,
      perfilesMedicos,
      perfilesCompletos: perfilesResult.data,
    };
    this.datosCacheTimestamp = ahora;
  }

  private async obtenerDatosCache() {
    await this.precargarDatosEstadisticas();
    return this.datosCache!;
  }

  async obtenerLogIngresos(): Promise<Ingreso[]> {
    const [ingresosResult, datos] = await Promise.all([
      Supabase.from(TABLA.REGISTRO_INGRESOS)
        .select(QUERY_REGISTRO_INGRESOS.BASICO)
        .order("fecha_ingreso", { ascending: false }),
      this.obtenerDatosCache(),
    ]);

    if (ingresosResult.error || !ingresosResult.data) {
      console.error(
        "[Supabase] Error al obtener log de ingresos:",
        ingresosResult.error?.message,
      );
      return [];
    }

    return ingresosResult.data.map((i) => {
      const perfil = datos.perfilesCompletos.find((p) => p.id === i.perfil_id);
      return {
        fecha: i.fecha_ingreso,
        nombre: perfil?.nombre ?? "Desconocido",
        apellido: perfil?.apellido ?? "",
        rol: perfil?.rol ?? "N/A",
      };
    });
  }

  async obtenerTurnosPorEspecialidad(): Promise<TurnosPorEspecialidad[]> {
    const datos = await this.obtenerDatosCache();

    const ids: number[] = [
      ...new Set(
        datos.citas
          .map((c) => c.especialidad_id)
          .filter((id): id is number => id !== null),
      ),
    ];

    const contador = new Map<number, number>();
    for (const cita of datos.citas) {
      if (!cita.especialidad_id) continue;
      contador.set(
        cita.especialidad_id,
        (contador.get(cita.especialidad_id) ?? 0) + 1,
      );
    }

    return ids.map((id) => {
      const especialidad = datos.especialidades.find((e) => e.id === id);
      return {
        especialidad: especialidad?.nombre ?? "Sin especialidad",
        cantidad: contador.get(id) ?? 0,
      };
    });
  }

  async obtenerPacientesPorEspecialidad(): Promise<PacientesPorEspecialidad[]> {
    const datos = await this.obtenerDatosCache();

    const especialidadIds: number[] = [
      ...new Set(
        datos.citas
          .map((c) => c.especialidad_id)
          .filter((id): id is number => id !== null),
      ),
    ];

    // Agrupar pacientes únicos por especialidad
    const pacientesPorEspecialidad = new Map<number, Set<number>>();
    for (const cita of datos.citas) {
      if (!cita.especialidad_id || !cita.paciente_id) continue;

      if (!pacientesPorEspecialidad.has(cita.especialidad_id)) {
        pacientesPorEspecialidad.set(cita.especialidad_id, new Set());
      }
      pacientesPorEspecialidad.get(cita.especialidad_id)!.add(cita.paciente_id);
    }

    return especialidadIds.map((id) => {
      const especialidad = datos.especialidades.find((e) => e.id === id);
      const pacientesUnicos = pacientesPorEspecialidad.get(id)?.size ?? 0;
      return {
        especialidad: especialidad?.nombre ?? "Sin especialidad",
        cantidad: pacientesUnicos,
      };
    });
  }

  async obtenerMedicosPorEspecialidad(): Promise<MedicosPorEspecialidad[]> {
    const datos = await this.obtenerDatosCache();

    const especialidadIds: number[] = [
      ...new Set(
        datos.relacionesEspecialistas
          .map((r) => r.especialidad_id)
          .filter((id): id is number => id !== null),
      ),
    ];

    // Contar médicos únicos por especialidad
    const medicosPorEspecialidad = new Map<number, Set<number>>();
    for (const relacion of datos.relacionesEspecialistas) {
      if (!relacion.especialidad_id || !relacion.perfil_id) continue;

      if (!medicosPorEspecialidad.has(relacion.especialidad_id)) {
        medicosPorEspecialidad.set(relacion.especialidad_id, new Set());
      }

      medicosPorEspecialidad
        .get(relacion.especialidad_id)!
        .add(relacion.perfil_id);
    }

    return especialidadIds.map((id) => {
      const especialidad = datos.especialidades.find((e) => e.id === id);
      const medicosUnicos = medicosPorEspecialidad.get(id)?.size ?? 0;
      return {
        especialidad: especialidad?.nombre ?? "Sin especialidad",
        cantidad: medicosUnicos,
      };
    });
  }

  async obtenerCitasPorEstado(pacienteId?: number): Promise<CitasPorEstado[]> {
    const datos = await this.obtenerDatosCache();

    const citasFiltradas = pacienteId
      ? datos.citas.filter((c) => c.paciente_id === pacienteId)
      : datos.citas;

    const contadorEstados = new Map<string, number>();
    for (const cita of citasFiltradas) {
      if (cita.estado) {
        contadorEstados.set(
          cita.estado,
          (contadorEstados.get(cita.estado) ?? 0) + 1,
        );
      }
    }

    return Object.values(EstadoCita).map((estado) => ({
      estado,
      cantidad: contadorEstados.get(estado) ?? 0,
    }));
  }

  async obtenerPacientes(): Promise<Paciente[]> {
    const datos = await this.obtenerDatosCache();

    const pacienteIds = new Set(
      datos.citas
        .map((c) => c.paciente_id)
        .filter((id): id is number => id !== null),
    );

    return Array.from(pacienteIds)
      .map((id) => {
        const perfil = datos.perfilesCompletos.find((p) => p.id === id);
        if (!perfil) return null;
        return {
          id,
          nombre: perfil.nombre ?? "",
          apellido: perfil.apellido ?? "",
        };
      })
      .filter((p): p is Paciente => p !== null)
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
  }

  async obtenerTurnosPorDia(): Promise<TurnosPorDia[]> {
    const datos = await this.obtenerDatosCache();

    const agrupado = new Map<string, number>();
    for (const cita of datos.citas) {
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
    const datos = await this.obtenerDatosCache();

    // Filtrar por rango de fechas
    const citasFiltradas = datos.citas.filter((c) => {
      if (!desde || !hasta) return true;
      const fechaCita = new Date(c.fecha_hora);
      return fechaCita >= new Date(desde) && fechaCita <= new Date(hasta);
    });

    return this.procesarTurnosPorMedico(
      citasFiltradas,
      datos.perfilesMedicos,
      null,
    );
  }

  async obtenerTurnosFinalizadosPorMedico(
    desde: string,
    hasta: string,
  ): Promise<TurnosPorMedico[]> {
    const datos = await this.obtenerDatosCache();

    // Filtrar por rango de fechas y estado
    const citasFiltradas = datos.citas.filter((c) => {
      const enRango =
        !desde ||
        !hasta ||
        (new Date(c.fecha_hora) >= new Date(desde) &&
          new Date(c.fecha_hora) <= new Date(hasta));
      return enRango && c.estado === EstadoCita.COMPLETADO;
    });

    return this.procesarTurnosPorMedico(
      citasFiltradas,
      datos.perfilesMedicos,
      null,
    );
  }

  private procesarTurnosPorMedico(
    citas: { especialista_id: number | null; estado?: string }[],
    perfiles: { id: number; nombre: string; apellido: string }[],
    estadoFiltro: string | null,
  ): TurnosPorMedico[] {
    const citasFiltradas = estadoFiltro
      ? citas.filter((c) => c.estado === estadoFiltro)
      : citas;

    const ids: number[] = [
      ...new Set(
        citasFiltradas
          .map((c) => c.especialista_id)
          .filter((id): id is number => id !== null),
      ),
    ];

    if (ids.length === 0) {
      return [];
    }

    const contador = new Map<number, number>();
    for (const cita of citasFiltradas) {
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

    const [ingresosResult, datos] = await Promise.all([
      Supabase.from(TABLA.REGISTRO_INGRESOS)
        .select(QUERY_REGISTRO_INGRESOS.BASICO)
        .gte("fecha_ingreso", fechaInicio)
        .order("fecha_ingreso", { ascending: true }),
      this.obtenerDatosCache(),
    ]);

    if (ingresosResult.error || !ingresosResult.data) {
      console.error(
        `[Supabase] Error al obtener ingresos de ${rol}:`,
        ingresosResult.error?.message,
      );
      return { datos: [], maxY: 40 };
    }

    const perfilesRol = new Set(
      datos.perfilesCompletos.filter((p) => p.rol === rol).map((p) => p.id),
    );

    const ingresosFiltrados = ingresosResult.data.filter((i) =>
      perfilesRol.has(i.perfil_id),
    );

    const agrupadoPorDia = new Map<string, number>();

    for (const ingreso of ingresosFiltrados) {
      const fecha = new Date(ingreso.fecha_ingreso);
      const diaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

      agrupadoPorDia.set(diaKey, (agrupadoPorDia.get(diaKey) ?? 0) + 1);
    }

    const datosResultado: IngresosPorHora[] = Array.from(
      agrupadoPorDia.entries(),
    ).map(([fecha_hora, cantidad]) => ({
      fecha_hora,
      cantidad,
    }));

    const maxCantidad = Math.max(...datosResultado.map((d) => d.cantidad), 0);
    const maxY = maxCantidad === 0 ? 40 : Math.ceil((maxCantidad + 1) / 5) * 5;

    return { datos: datosResultado, maxY };
  }
}
