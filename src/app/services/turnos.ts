import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EspecialistaTurnos } from "../models/Turnos/EspecialistaTurnos";
import { EspecialidadTurnos } from "../models/Turnos/EspecialidadTurnos";
import { CitaTurnos } from "../models/Turnos/CitaTurnos";
import { RespuestaApi } from "../models/RespuestaApi";
import { DatoDinamicoTurnos } from "../models/Turnos/DatoDinamicoTurnos";
import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";
import { RegistroMedicoTurnos } from "../models/Turnos/RegistroMedicoTurnos";
import { EstadoCita } from "../enums/EstadoCita";
import { DisponibilidadService } from "./horarios-disponibles";
import { CitasService } from "./citas";
import { TABLA, QUERY_VISTA_ESPECIALISTAS_FULL } from "../constantes";

export interface DiasDisponibles {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
}

@Injectable({
  providedIn: "root",
})
export class Turnos {
  private cacheDisponibilidad = new Map<
    string,
    {
      data: string[];
      timestamp: number;
    }
  >();
  private readonly CACHE_TTL = 1 * 60 * 1000;

  constructor(
    private disponibilidadService: DisponibilidadService,
    private citasService: CitasService,
  ) {}

  async obtenerEspecialistas(): Promise<EspecialistaTurnos[]> {
    const { data: especialistas, error } = await Supabase.from(
      TABLA.VISTA_ESPECIALISTAS_FULL,
    ).select(QUERY_VISTA_ESPECIALISTAS_FULL.ESPECIALISTA_ESPECIALIDADES);

    if (error || !especialistas) {
      console.error("Error al obtener especialistas:", error);
      return [];
    }

    return especialistas.map((e) => ({
      id: e.especialista_id,
      nombre: e.nombre,
      apellido: e.apellido,
      imagenPerfil: e.url_imagen_perfil,
      emailVerificado: true,
      validadoAdmin: true,
      activo: true,
    }));
  }

  async obtenerEspecialistasConDisponibilidad(
    diasARevisar = 15,
  ): Promise<EspecialistaTurnos[]> {
    const todosEspecialistas = await this.obtenerEspecialistas();

    const especialistasConDisponibilidad: EspecialistaTurnos[] = [];

    for (const especialista of todosEspecialistas) {
      if (especialista.validadoAdmin === true) {
        const tieneDisponibilidad = await this.especialistaTieneDisponibilidad(
          especialista.id,
          diasARevisar,
        );

        if (tieneDisponibilidad) {
          especialistasConDisponibilidad.push(especialista);
        }
      }
    }

    return especialistasConDisponibilidad;
  }

  async obtenerEspecialidadesDeEspecialista(
    idEspecialista: number,
  ): Promise<EspecialidadTurnos[]> {
    const { data: especialidades, error } = await Supabase.from(
      TABLA.VISTA_ESPECIALISTA_ESPECIALIDADES,
    )
      .select(
        `
          especialista_id,
          especialidad_id,
          nombre_especialidad,
          url_icono,
          duracion_minutos
        `,
      )
      .eq("especialista_id", idEspecialista);

    if (error || !especialidades) {
      console.error("Error al obtener especialidades:", error);
      return [];
    }

    return especialidades.map((p) => {
      return {
        id: p.especialidad_id,
        nombre: p.nombre_especialidad,
        icono: p.url_icono,
        duracion: p.duracion_minutos,
      } as EspecialidadTurnos;
    });
  }

  async obtenerDiasEspecialista(idEspecialista: number): Promise<string[]> {
    return this.disponibilidadService.obtenerDiasEspecialista(idEspecialista);
  }

  async calcularFechasDisponibles(
    idEspecialista: number,
    diasARevisar = 15,
    desdeFecha = new Date(),
  ): Promise<string[]> {
    return this.disponibilidadService.calcularFechasDisponibles(
      idEspecialista,
      diasARevisar,
      desdeFecha,
    );
  }

  async obtenerFechasConHorariosDisponibles(
    idEspecialista: number,
    duracionMin: number,
    diasARevisar = 15,
    desdeFecha = new Date(),
    pacienteId?: number,
  ): Promise<string[]> {
    const cacheKey = `${idEspecialista}-${duracionMin}-${desdeFecha.toISOString().split("T")[0]}-${pacienteId || "sin-paciente"}`;
    const cached = this.cacheDisponibilidad.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const disponibilidades =
      await this.disponibilidadService.obtenerTodasDisponibilidades(
        idEspecialista,
      );

    if (disponibilidades.size === 0) {
      return [];
    }

    const fechasPotenciales =
      await this.disponibilidadService.calcularFechasDisponibles(
        idEspecialista,
        diasARevisar,
        desdeFecha,
      );

    const promesas = fechasPotenciales.map(async (fecha) => {
      const horarios = await this.obtenerHorariosDisponibles(
        fecha,
        idEspecialista,
        duracionMin,
        pacienteId,
        disponibilidades,
      );
      return horarios.length > 0 ? fecha : null;
    });

    const resultados = await Promise.all(promesas);
    const fechasDisponibles = resultados.filter(
      (fecha): fecha is string => fecha !== null,
    );

    this.cacheDisponibilidad.set(cacheKey, {
      data: fechasDisponibles,
      timestamp: Date.now(),
    });

    return fechasDisponibles;
  }

  async obtenerFechasConHorariosDisponiblesProgresivo(
    idEspecialista: number,
    duracionMin: number,
    pacienteId?: number,
    diasIniciales = 7,
    diasTotales = 15,
  ): Promise<{ inicial: string[]; completar: () => Promise<string[]> }> {
    const desdeFecha = new Date();
    const cacheKey = `${idEspecialista}-${duracionMin}-${desdeFecha.toISOString().split("T")[0]}-${pacienteId || "sin-paciente"}`;
    const cached = this.cacheDisponibilidad.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        inicial: cached.data.slice(0, diasIniciales),
        completar: async () => cached.data,
      };
    }

    const disponibilidades =
      await this.disponibilidadService.obtenerTodasDisponibilidades(
        idEspecialista,
      );

    if (disponibilidades.size === 0) {
      return { inicial: [], completar: async () => [] };
    }

    const fechasPotencialesIniciales =
      await this.disponibilidadService.calcularFechasDisponibles(
        idEspecialista,
        diasIniciales,
        desdeFecha,
      );

    const promesasIniciales = fechasPotencialesIniciales.map(async (fecha) => {
      const horarios = await this.obtenerHorariosDisponibles(
        fecha,
        idEspecialista,
        duracionMin,
        pacienteId,
        disponibilidades,
      );
      return horarios.length > 0 ? fecha : null;
    });

    const resultadosIniciales = await Promise.all(promesasIniciales);
    const fechasInicialesDisponibles = resultadosIniciales.filter(
      (fecha): fecha is string => fecha !== null,
    );

    const completar = async (): Promise<string[]> => {
      const fechasPotencialesTotales =
        await this.disponibilidadService.calcularFechasDisponibles(
          idEspecialista,
          diasTotales,
          desdeFecha,
        );

      const fechasRestantes = fechasPotencialesTotales.slice(diasIniciales);

      const promesasRestantes = fechasRestantes.map(async (fecha) => {
        const horarios = await this.obtenerHorariosDisponibles(
          fecha,
          idEspecialista,
          duracionMin,
          pacienteId,
          disponibilidades,
        );
        return horarios.length > 0 ? fecha : null;
      });

      const resultadosRestantes = await Promise.all(promesasRestantes);
      const fechasRestantesDisponibles = resultadosRestantes.filter(
        (fecha): fecha is string => fecha !== null,
      );

      const todasLasFechas = [
        ...fechasInicialesDisponibles,
        ...fechasRestantesDisponibles,
      ];

      this.cacheDisponibilidad.set(cacheKey, {
        data: todasLasFechas,
        timestamp: Date.now(),
      });

      return todasLasFechas;
    };

    return {
      inicial: fechasInicialesDisponibles,
      completar,
    };
  }

  invalidarCacheDisponibilidad(especialistaId?: number): void {
    if (!especialistaId) {
      this.cacheDisponibilidad.clear();
      return;
    }

    const keysToDelete: string[] = [];
    this.cacheDisponibilidad.forEach((_, key) => {
      if (key.startsWith(`${especialistaId}-`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cacheDisponibilidad.delete(key));
  }

  async especialistaTieneDisponibilidad(
    idEspecialista: number,
    diasARevisar = 15,
  ): Promise<boolean> {
    const especialidades =
      await this.obtenerEspecialidadesDeEspecialista(idEspecialista);

    if (especialidades.length === 0) {
      return false;
    }

    for (const especialidad of especialidades) {
      const fechasConHorarios = await this.obtenerFechasConHorariosDisponibles(
        idEspecialista,
        especialidad.duracion,
        diasARevisar,
      );

      if (fechasConHorarios.length > 0) {
        return true;
      }
    }

    return false;
  }

  async obtenerHorariosDisponibles(
    fecha: string,
    especialistaId: number,
    duracion: number,
    pacienteId?: number,
    disponibilidadesCache?: Map<
      number,
      { hora_inicio: string; hora_fin: string }
    >,
  ): Promise<string[]> {
    const diaSemana = this.disponibilidadService.calcularDiaSemana(fecha);
    let disponibilidad: { hora_inicio: string; hora_fin: string } | null;

    if (disponibilidadesCache) {
      disponibilidad = disponibilidadesCache.get(diaSemana) || null;
    } else {
      disponibilidad =
        await this.disponibilidadService.obtenerDisponibilidadDia(
          especialistaId,
          diaSemana,
        );
    }

    if (!disponibilidad) {
      return [];
    }

    const { hora_inicio, hora_fin } = disponibilidad;
    const disponibilidadInicio = this.disponibilidadService.parseHoraLocal(
      fecha,
      hora_inicio,
    );
    const disponibilidadFin = this.disponibilidadService.parseHoraLocal(
      fecha,
      hora_fin,
    );

    const todasCitas = await this.citasService.obtenerCitasCombinadasDia(
      especialistaId,
      fecha,
      pacienteId,
    );

    const citasEspecialista = todasCitas.filter(
      (c) => c.especialista_id === especialistaId || !c.especialista_id,
    );
    const citasPaciente = pacienteId
      ? todasCitas.filter((c) => c.paciente_id === pacienteId)
      : [];

    const bloquesOcupados =
      this.citasService.construirBloquesOcupados(citasEspecialista);

    const espaciosLibres: { inicio: Date; fin: Date }[] = [];
    let cursor = new Date(disponibilidadInicio);

    for (const bloque of bloquesOcupados) {
      if (cursor < bloque.inicio) {
        const espacioFin = new Date(
          Math.min(bloque.inicio.getTime(), disponibilidadFin.getTime()),
        );
        if (cursor < espacioFin) {
          espaciosLibres.push({ inicio: new Date(cursor), fin: espacioFin });
        }
      }
      if (bloque.fin > cursor) {
        cursor = new Date(Math.max(cursor.getTime(), bloque.fin.getTime()));
      }
    }

    if (cursor < disponibilidadFin) {
      espaciosLibres.push({ inicio: cursor, fin: disponibilidadFin });
    }

    const turnosDisponibles: string[] = [];

    for (const bloque of espaciosLibres) {
      let horaTurno = new Date(bloque.inicio);

      while (horaTurno.getTime() + duracion * 60000 <= bloque.fin.getTime()) {
        turnosDisponibles.push(
          horaTurno.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
        horaTurno = new Date(horaTurno.getTime() + duracion * 60000);
      }
    }

    if (citasPaciente.length > 0) {
      const turnosFiltrados: string[] = [];

      for (const turnoHora of turnosDisponibles) {
        const inicioTurno = this.disponibilidadService.parseHoraLocal(
          fecha,
          turnoHora,
        );
        const finTurno = new Date(inicioTurno.getTime() + duracion * 60000);

        let solapa = false;
        for (const citaPac of citasPaciente) {
          const inicioCitaPac = new Date(citaPac.fecha_hora);
          const finCitaPac = new Date(
            inicioCitaPac.getTime() + citaPac.duracion_min * 60000,
          );

          if (
            this.citasService.verificarSolapamiento(
              inicioTurno,
              finTurno,
              inicioCitaPac,
              finCitaPac,
            )
          ) {
            solapa = true;
            break;
          }
        }

        if (!solapa) {
          turnosFiltrados.push(turnoHora);
        }
      }

      return turnosFiltrados;
    }

    return turnosDisponibles;
  }

  async darAltaCita(cita: CitaTurnos): Promise<RespuestaApi<CitaTurnos>> {
    const resultado = await this.citasService.darAltaCita(cita);
    if (resultado.success) {
      this.invalidarCacheDisponibilidad(cita.especialistaId);
    }
    return resultado;
  }

  async obtenerCitasConRegistro(): Promise<CitaCompletaTurnos[]> {
    return this.citasService.obtenerCitasConRegistro();
  }

  async obtenerCitasPaciente(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    return this.citasService.obtenerCitasPacienteCompletas(id_usuario);
  }

  async cancelarCitaPaciente(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    const resultado = await this.citasService.actualizarEstadoCita(
      cita.citaId,
      EstadoCita.CANCELADO,
      [EstadoCita.COMPLETADO],
      cita.estado as EstadoCita,
      "No se puede cancelar un turno ya realizado.",
      "Turno cancelado exitosamente.",
      { comentario_paciente: comentario },
    );
    if (resultado.success) {
      this.invalidarCacheDisponibilidad(cita.especialistaId);
    }
    return resultado;
  }

  async cargarComentarioAtencion(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado !== EstadoCita.COMPLETADO) {
      return {
        success: false,
        message:
          "El turno debe ser realizado para poder calificar la atencion.",
      };
    }

    const { error } = await Supabase.from(TABLA.CITAS)
      .update({
        comentario_paciente: comentario,
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "No se pudo registrar la calificacion",
        errorCode: error?.code ?? "insert_error",
      };
    }

    return {
      success: true,
      message: "Atencion calificada exitosamente.",
      data: true,
    };
  }

  async cancelarCitaEspecialista(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    const resultado = await this.citasService.actualizarEstadoCita(
      cita.citaId,
      EstadoCita.CANCELADO,
      [EstadoCita.COMPLETADO, EstadoCita.ACEPTADO, EstadoCita.RECHAZADO],
      cita.estado as EstadoCita,
      "No se puede cancelar un turno ya realizado, aceptado o rechazado.",
      "Turno cancelado exitosamente.",
      { comentario_especialista: comentario },
    );
    if (resultado.success) {
      this.invalidarCacheDisponibilidad(cita.especialistaId);
    }
    return resultado;
  }

  async rechazarCitaEspecialista(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    return this.citasService.actualizarEstadoCita(
      cita.citaId,
      EstadoCita.RECHAZADO,
      [EstadoCita.COMPLETADO, EstadoCita.ACEPTADO, EstadoCita.CANCELADO],
      cita.estado as EstadoCita,
      "No se puede rechazar un turno ya realizado, aceptado o cancelado.",
      "Turno rechazado exitosamente.",
      { comentario_especialista: comentario },
    );
  }

  async aceptarCitaEspecialista(
    cita: CitaCompletaTurnos,
  ): Promise<RespuestaApi<boolean>> {
    return this.citasService.actualizarEstadoCita(
      cita.citaId,
      EstadoCita.ACEPTADO,
      [EstadoCita.COMPLETADO, EstadoCita.RECHAZADO, EstadoCita.CANCELADO],
      cita.estado as EstadoCita,
      "No se puede aceptar un turno ya realizado, rechazado o cancelado.",
      "Turno aceptado exitosamente.",
    );
  }

  async completarCitaEspecialista(
    cita: CitaCompletaTurnos,
    resenia: string,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado !== EstadoCita.ACEPTADO) {
      return {
        success: false,
        message: "No se puede finalizar un turno que no fue aceptado.",
      };
    }

    return this.citasService.actualizarEstadoCita(
      cita.citaId,
      EstadoCita.COMPLETADO,
      [],
      cita.estado as EstadoCita,
      "",
      "Turno completado exitosamente.",
      { resenia },
    );
  }

  async obtenerCitasEspecialista(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    return this.citasService.obtenerCitasEspecialistaCompletas(id_usuario);
  }

  async cargarHistoriaClinica(
    registro: RegistroMedicoTurnos,
    datosDinamicos: DatoDinamicoTurnos[],
  ): Promise<RespuestaApi<boolean>> {
    if (datosDinamicos.length < 1 || datosDinamicos.length > 6) {
      return {
        success: false,
        message: "Debe cargar entre 1 y 6 datos médicos dinámicos",
      };
    }

    const { error: errorRegistro } = await Supabase.from(
      TABLA.REGISTROS_MEDICOS,
    ).insert({
      cita_id: registro.citaId,
      altura_cm: registro.alturaCm,
      peso_kg: registro.pesoKg,
      temperatura_c: registro.temperaturaC,
      presion_arterial: registro.presionArterial,
    });

    if (errorRegistro) {
      return {
        success: false,
        message:
          "Error al guardar los datos principales de la historia clínica",
      };
    }

    const dinamicosFormateados = datosDinamicos.map((dato) => ({
      cita_id: registro.citaId,
      clave: dato.clave,
      valor: dato.valor,
    }));

    const { error: errorDinamicos } = await Supabase.from(
      TABLA.DATOS_MEDICOS_DINAMICOS,
    ).insert(dinamicosFormateados);

    if (errorDinamicos) {
      return {
        success: false,
        message:
          "Error al guardar los datos adicionales de la historia clínica",
      };
    }

    return {
      success: true,
      message: "Historia clínica guardada correctamente",
    };
  }

  obtenerProximosTurnos(
    citas: CitaCompletaTurnos[],
    cantidad: 3,
  ): CitaCompletaTurnos[] {
    const ahora = new Date();
    return citas
      .filter((c) => {
        const fechaCita = new Date(c.fechaHora);
        return fechaCita >= ahora && c.estado === EstadoCita.ACEPTADO;
      })
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
      )
      .slice(0, cantidad);
  }

  calcularResumenActividad(citas: CitaCompletaTurnos[]): {
    turnosPendientes: number;
    turnosHoy: number;
    turnosMes: number;
    ultimaActividad: Date | null;
  } {
    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
    );
    const finHoy = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const turnosPendientes = citas.filter((c) => {
      const fechaCita = new Date(c.fechaHora);
      return (
        fechaCita >= ahora &&
        (c.estado === EstadoCita.SOLICITADO || c.estado === EstadoCita.ACEPTADO)
      );
    }).length;

    const turnosHoy = citas.filter((c) => {
      const fechaCita = new Date(c.fechaHora);
      return (
        fechaCita >= hoy &&
        fechaCita < finHoy &&
        c.estado !== EstadoCita.CANCELADO &&
        c.estado !== EstadoCita.RECHAZADO
      );
    }).length;

    const turnosMes = citas.filter((c) => {
      const fechaCita = new Date(c.fechaHora);
      return (
        fechaCita >= inicioMes &&
        fechaCita <= finMes &&
        c.estado !== EstadoCita.CANCELADO &&
        c.estado !== EstadoCita.RECHAZADO
      );
    }).length;

    const citasRealizadas = citas
      .filter((c) => c.estado === EstadoCita.REALIZADO)
      .sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
      );

    const ultimaActividad =
      citasRealizadas.length > 0
        ? new Date(citasRealizadas[0].fechaHora)
        : null;

    return {
      turnosPendientes,
      turnosHoy,
      turnosMes,
      ultimaActividad,
    };
  }
}
