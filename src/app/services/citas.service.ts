import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EstadoCita } from "../enums/EstadoCita";
import { CitaTurnos } from "../models/Turnos/CitaTurnos";
import { RespuestaApi } from "../models/RespuestaApi";
import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";
import { DatoDinamicoTurnos } from "../models/Turnos/DatoDinamicoTurnos";
import { DisponibilidadService } from "./disponibilidad.service";
import {
  TABLA,
  QUERY_CITAS,
  QUERY_DATOS_MEDICOS_DINAMICOS,
} from "../constantes";

interface CitaVista {
  cita_id: number;
  fecha_hora: string;
  duracion_min: number;
  estado: string;
  comentario_paciente: string | null;
  comentario_especialista: string | null;
  resenia: string | null;
  paciente_id: number;
  paciente_nombre_completo: string;
  especialista_id: number;
  especialista_nombre_completo: string;
  especialidad_id: number;
  especialidad_nombre: string;
  altura_cm: number | null;
  peso_kg: number | null;
  temperatura_c: number | null;
  presion_arterial: string | null;
}

interface CitaHorarios {
  fecha_hora: string;
  duracion_min: number;
  especialista_id?: number;
  paciente_id?: number;
}

/**
 * Servicio especializado para manejo de citas
 * Responsabilidades:
 * - CRUD de citas
 * - Obtener citas por especialista/paciente
 * - Validaciones de disponibilidad
 * - Cálculo de bloques ocupados
 */
@Injectable({
  providedIn: "root",
})
export class CitasService {
  constructor(private disponibilidadService: DisponibilidadService) {}

  /**
   * Factory method para crear respuestas de error consistentes
   */
  private crearRespuestaError<T>(
    mensaje: string,
    errorCode?: string,
  ): RespuestaApi<T> {
    return {
      success: false,
      message: mensaje,
      errorCode,
    };
  }

  /**
   * Factory method para crear respuestas de éxito consistentes
   */
  private crearRespuestaExito<T>(mensaje: string, data?: T): RespuestaApi<T> {
    return {
      success: true,
      message: mensaje,
      data,
    };
  }

  /**
   * Verifica si dos rangos de tiempo se solapan
   */
  verificarSolapamiento(
    inicio1: Date,
    fin1: Date,
    inicio2: Date,
    fin2: Date,
  ): boolean {
    return inicio1 < fin2 && fin1 > inicio2;
  }

  /**
   * Actualiza el estado de una cita con validaciones
   */
  async actualizarEstadoCita(
    citaId: number,
    nuevoEstado: EstadoCita,
    estadosNoPermitidos: EstadoCita[],
    estadoActual: EstadoCita,
    mensajeError: string,
    mensajeExito: string,
    camposAdicionales?: Record<string, unknown>,
  ): Promise<RespuestaApi<boolean>> {
    // Validar que el estado actual permite la transición
    if (estadosNoPermitidos.includes(estadoActual)) {
      return this.crearRespuestaError(mensajeError);
    }

    // Preparar datos de actualización
    const datosActualizacion: Record<string, unknown> = {
      estado: nuevoEstado,
      ...camposAdicionales,
    };

    const { error } = await Supabase.from(TABLA.CITAS)
      .update(datosActualizacion)
      .eq("id", citaId);

    if (error) {
      return this.crearRespuestaError(
        `Ocurrió un error al actualizar el turno.`,
        error.code,
      );
    }

    return this.crearRespuestaExito(mensajeExito, true);
  }

  /**
   * Método privado centralizado para mapear citas con sus datos dinámicos
   */
  private async mapearCitasCompletas(
    citasPlano: CitaVista[],
  ): Promise<CitaCompletaTurnos[]> {
    if (!citasPlano || citasPlano.length === 0) {
      return [];
    }

    const citaIds = citasPlano.map((c) => c.cita_id);

    const { data: datosDinamicos, error: errorDatos } = await Supabase.from(
      TABLA.DATOS_MEDICOS_DINAMICOS,
    )
      .select(QUERY_DATOS_MEDICOS_DINAMICOS.TODOS_CAMPOS)
      .in("cita_id", citaIds);

    if (errorDatos) {
      throw new Error(
        `Error al obtener datos dinámicos: ${errorDatos.message}`,
      );
    }

    const datosPorCita: Record<number, DatoDinamicoTurnos[]> = {};
    for (const dato of datosDinamicos || []) {
      if (!dato.cita_id) continue;
      if (!datosPorCita[dato.cita_id]) {
        datosPorCita[dato.cita_id] = [];
      }
      datosPorCita[dato.cita_id].push({
        id: dato.id,
        clave: dato.clave,
        valor: dato.valor,
        citaId: dato.cita_id,
      });
    }

    return citasPlano.map(
      (c: CitaVista): CitaCompletaTurnos => ({
        citaId: c.cita_id,
        fechaHora: new Date(c.fecha_hora),
        duracionMin: c.duracion_min,
        estado: c.estado,
        comentarioPaciente: c.comentario_paciente ?? "",
        comentarioEspecialista: c.comentario_especialista ?? "",
        resenia: c.resenia ?? "",
        pacienteId: c.paciente_id,
        pacienteNombreCompleto: c.paciente_nombre_completo,
        especialistaId: c.especialista_id,
        especialistaNombreCompleto: c.especialista_nombre_completo,
        especialidadId: c.especialidad_id,
        especialidadNombre: c.especialidad_nombre,
        alturaCm: Number(c.altura_cm),
        pesoKg: Number(c.peso_kg),
        temperaturaC: Number(c.temperatura_c),
        presionArterial: c.presion_arterial ?? "",
        datosDinamicos: datosPorCita[c.cita_id] || [],
      }),
    );
  }

  /**
   * Obtiene todas las citas completas con sus datos médicos
   */
  async obtenerCitasConRegistro(): Promise<CitaCompletaTurnos[]> {
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      TABLA.VISTA_CITAS_ENTERAS,
    ).select("*");

    if (errorCitas) {
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    }

    return this.mapearCitasCompletas(citasPlano || []);
  }

  /**
   * Obtiene todas las citas completas de un paciente
   */
  async obtenerCitasPacienteCompletas(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      TABLA.VISTA_CITAS_ENTERAS,
    )
      .select("*")
      .eq("paciente_id", id_usuario);

    if (errorCitas) {
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    }

    return this.mapearCitasCompletas(citasPlano || []);
  }

  /**
   * Obtiene todas las citas completas de un especialista
   */
  async obtenerCitasEspecialistaCompletas(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      TABLA.VISTA_CITAS_ENTERAS,
    )
      .select("*")
      .eq("especialista_id", id_usuario);

    if (errorCitas) {
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    }

    return this.mapearCitasCompletas(citasPlano || []);
  }

  /**
   * Obtiene citas de un especialista en una fecha específica (solo horarios)
   */
  private async obtenerCitasEspecialista(
    especialistaId: number,
    fecha: string,
  ): Promise<CitaHorarios[]> {
    // Optimización: cálculo inline para evitar overhead
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const { data, error } = await Supabase.from(TABLA.CITAS)
      .select(QUERY_CITAS.FECHA_DURACION)
      .eq("especialista_id", especialistaId)
      .neq("estado", EstadoCita.CANCELADO)
      .neq("estado", EstadoCita.RECHAZADO)
      .gte("fecha_hora", inicioDia.toISOString())
      .lte("fecha_hora", finDia.toISOString());

    if (error) {
      console.error("Error al obtener citas del especialista:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtiene citas de un paciente en una fecha específica (solo horarios)
   */
  private async obtenerCitasPaciente(
    pacienteId: number,
    fecha: string,
  ): Promise<CitaHorarios[]> {
    // Optimización: cálculo inline para evitar overhead
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const { data, error } = await Supabase.from(TABLA.CITAS)
      .select(QUERY_CITAS.FECHA_DURACION_PARTICIPANTES)
      .eq("paciente_id", pacienteId)
      .in("estado", [
        EstadoCita.SOLICITADO,
        EstadoCita.ACEPTADO,
        EstadoCita.REALIZADO,
        EstadoCita.COMPLETADO,
      ])
      .gte("fecha_hora", inicioDia.toISOString())
      .lte("fecha_hora", finDia.toISOString());

    if (error) {
      console.error("Error al obtener citas del paciente:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtiene todas las citas (especialista + paciente) en una fecha
   * Simplifica la query compleja en obtenerHorariosDisponibles
   * ✨ Point 6: Query simplificado y más legible
   * ✨ Optimización: 1 query única cuando hay pacienteId (en vez de 2)
   */
  async obtenerCitasCombinadasDia(
    especialistaId: number,
    fecha: string,
    pacienteId?: number,
  ): Promise<CitaHorarios[]> {
    if (!pacienteId) {
      return this.obtenerCitasEspecialista(especialistaId, fecha);
    }

    // ✨ Optimización: Query única combinada en vez de 2 separadas
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const { data, error } = await Supabase.from(TABLA.CITAS)
      .select(QUERY_CITAS.FECHA_DURACION_PARTICIPANTES)
      .or(
        `and(especialista_id.eq.${especialistaId},estado.neq.${EstadoCita.CANCELADO},estado.neq.${EstadoCita.RECHAZADO}),and(paciente_id.eq.${pacienteId},estado.in.(${EstadoCita.SOLICITADO},${EstadoCita.ACEPTADO},${EstadoCita.REALIZADO},${EstadoCita.COMPLETADO}))`,
      )
      .gte("fecha_hora", inicioDia.toISOString())
      .lte("fecha_hora", finDia.toISOString());

    if (error) {
      console.error("Error al obtener citas combinadas:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Construye bloques de tiempo ocupados a partir de citas
   */
  construirBloquesOcupados(
    citas: CitaHorarios[],
  ): { inicio: Date; fin: Date }[] {
    const bloques = citas.map((cita) => {
      const inicio = new Date(cita.fecha_hora);
      const fin = new Date(inicio.getTime() + cita.duracion_min * 60000);
      return { inicio, fin };
    });

    // Ordenar por inicio
    bloques.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    return bloques;
  }

  /**
   * Valida que un horario específico esté disponible
   * Retorna true si está disponible, false si hay conflicto
   */
  async validarHorarioDisponible(
    especialistaId: number,
    fechaHora: Date,
    duracionMin: number,
  ): Promise<boolean> {
    const inicio = fechaHora;
    const fin = new Date(inicio.getTime() + duracionMin * 60000);

    // Buscar citas que se solapen con este horario
    const { data, error } = await Supabase.from(TABLA.CITAS)
      .select(QUERY_CITAS.FECHA_DURACION)
      .eq("especialista_id", especialistaId)
      .neq("estado", EstadoCita.CANCELADO)
      .neq("estado", EstadoCita.RECHAZADO)
      .gte(
        "fecha_hora",
        new Date(inicio.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ) // Un día antes
      .lte(
        "fecha_hora",
        new Date(fin.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      ); // Un día después

    if (error) {
      console.error("Error al validar horario:", error);
      return false;
    }

    // Verificar si alguna cita existente se solapa usando método centralizado
    const citas = data || [];
    for (const cita of citas) {
      const citaInicio = new Date(cita.fecha_hora);
      const citaFin = new Date(
        citaInicio.getTime() + cita.duracion_min * 60000,
      );

      if (this.verificarSolapamiento(inicio, fin, citaInicio, citaFin)) {
        return false; // Hay conflicto
      }
    }

    return true; // No hay conflictos
  }

  /**
   * Inserta una nueva cita con validación atómica
   */
  async darAltaCita(cita: CitaTurnos): Promise<RespuestaApi<CitaTurnos>> {
    try {
      // Validación pre-insert: verificar que el horario sigue disponible
      const estaDisponible = await this.validarHorarioDisponible(
        cita.especialistaId,
        cita.fechaHora,
        cita.duracionMin,
      );

      if (!estaDisponible) {
        return this.crearRespuestaError(
          "El horario seleccionado ya no está disponible. Por favor, elija otro.",
          "horario_no_disponible",
        );
      }

      const { data, error } = await Supabase.from(TABLA.CITAS)
        .insert({
          fecha_hora: cita.fechaHora.toISOString(),
          duracion_min: cita.duracionMin,
          paciente_id: cita.pacienteId,
          especialista_id: cita.especialistaId,
          especialidad_id: cita.especialidadId,
          estado: cita.estado,
          comentario_paciente: cita.comentarioPaciente,
          comentario_especialista: cita.comentarioEspecialista,
          resenia: cita.resenia,
        })
        .select(QUERY_CITAS.TODOS_CAMPOS)
        .maybeSingle();

      if (error || !data) {
        console.error("Error al insertar cita:", error);
        return this.crearRespuestaError(
          "No se pudo registrar la cita",
          error?.code ?? "insert_error",
        );
      }

      return this.crearRespuestaExito("Cita registrada exitosamente", {
        ...cita,
        fechaHora: new Date(data.fecha_hora),
      });
    } catch (e) {
      console.error("Excepción en darAltaCita:", e);
      return this.crearRespuestaError(
        "Ocurrió un error inesperado",
        "unexpected_error",
      );
    }
  }
}
