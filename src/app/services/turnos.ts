import { Injectable } from "@angular/core";
import { Supabase } from "../supabase";
import { EspecialistaTurnos } from "../models/Turnos/EspecialistaTurnos";
import { EspecialidadTurnos } from "../models/Turnos/EspecialidadTurnos";
import { CitaTurnos } from "../models/Turnos/CitaTurnos";
import { RespuestaApi } from "../models/RespuestaApi";
import { DatoDinamicoTurnos } from "../models/Turnos/DatoDinamicoTurnos";
import { CitaCompletaTurnos } from "../models/Turnos/CitaCompletaTurnos";
import { EncuestaTurnos } from "../models/Turnos/EncuestaTurnos";
import { RegistroMedicoTurnos } from "../models/Turnos/RegistroMedicoTurnos";

export interface DiasDisponibles {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
}

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

@Injectable({
  providedIn: "root",
})
export class Turnos {
  async obtenerEspecialistas(): Promise<EspecialistaTurnos[]> {
    const { data: perfiles, error } = await Supabase.from(
      "vista_perfiles_con_email",
    )
      .select(
        `
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
    `,
      )
      .eq("rol", "especialista")
      .eq("email_verificado_real", true);

    if (error || !perfiles) {
      console.error("Error al obtener usuarios:", error);
      return [];
    }

    return perfiles.map((p) => {
      const detallesEspecialista = Array.isArray(p.detalles_especialista)
        ? p.detalles_especialista[0]
        : (p.detalles_especialista ?? null);

      return {
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        imagenPerfil: p.url_imagen_perfil,
        emailVerificado: p.email_verificado_real ?? false,
        validadoAdmin: detallesEspecialista?.validado_admin ?? false,
        activo: detallesEspecialista.activo ?? false,
      } as EspecialistaTurnos;
    });
  }

  async obtenerEspecialidadesDeEspecialista(
    idEspecialista: number,
  ): Promise<EspecialidadTurnos[]> {
    const { data: especialidades, error } = await Supabase.from(
      "vista_especialista_especialidades",
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
      console.error("Error al obtener usuarios:", error);
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
    const { data: dias, error } = await Supabase.from("disponibilidades")
      .select("dia_semana")
      .eq("perfil_id", idEspecialista)
      .eq("habilitado", true);

    if (error || !dias) {
      console.error("Error al obtener días disponibles:", error);
      return [];
    }

    const diasSemanaMap: Record<number, string> = {
      1: "lunes",
      2: "martes",
      3: "miércoles",
      4: "jueves",
      5: "viernes",
      6: "sábado",
      7: "domingo",
    };

    // Convertimos a nombres y evitamos duplicados
    const nombresDias = dias
      .map((d) => diasSemanaMap[d.dia_semana])
      .filter((dia, index, self) => dia && self.indexOf(dia) === index);

    return nombresDias;
  }

  async calcularFechasDisponibles(
    idEspecialista: number,
    diasARevisar = 15,
    desdeFecha = new Date(),
  ): Promise<string[]> {
    const diasHabilitados = await this.obtenerDiasEspecialista(idEspecialista);

    const diasSemanaNombreANumero: Record<string, number> = {
      lunes: 1,
      martes: 2,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
      domingo: 0,
    };

    // Convertimos los nombres de días a sus números según JS
    const diasHabilitadosNumericos = diasHabilitados.map(
      (dia) => diasSemanaNombreANumero[dia.toLowerCase()],
    );

    const fechasDisponibles: string[] = [];

    for (let i = 0; i < diasARevisar; i++) {
      const fecha = new Date(desdeFecha);
      fecha.setDate(fecha.getDate() + i);

      const diaJS = fecha.getDay(); // 0: domingo, 1: lunes, ..., 6: sábado

      if (diasHabilitadosNumericos.includes(diaJS)) {
        // Formateamos como "YYYY-MM-DD"
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        fechasDisponibles.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    return fechasDisponibles;
  }

  async obtenerHorariosDisponibles(
    fecha: string, // formato "YYYY-MM-DD"
    especialistaId: number,
    duracion: number, // en minutos
  ): Promise<string[]> {
    // 1. Obtener día de la semana (1 = lunes ... 7 = domingo)
    const [year, month, day] = fecha.split("-").map(Number);
    const date = new Date(year, month - 1, day); // Correctamente en zona local

    const diaSemana = ((date.getDay() + 6) % 7) + 1;
    // getDay() => 0=Domingo ... 6=Sábado
    // El cálculo lo convierte a 1=Lunes ... 7=Domingo

    // 2. Traer disponibilidad del especialista para ese día
    const { data: disponibilidad, error: errorDisp } = await Supabase.from(
      "disponibilidades",
    )
      .select("hora_inicio, hora_fin")
      .eq("perfil_id", especialistaId)
      .eq("dia_semana", diaSemana)
      .eq("habilitado", true)
      .maybeSingle();

    console.log(disponibilidad, fecha, especialistaId, duracion, diaSemana);
    if (errorDisp || !disponibilidad) {
      console.error("Sin disponibilidad:", errorDisp);
      return [];
    }

    const { hora_inicio, hora_fin } = disponibilidad;

    function parseHoraLocal(fecha: string, hora: string): Date {
      const [year, month, day] = fecha.split("-").map(Number);
      const [hour, minute] = hora.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }

    const disponibilidadInicio = parseHoraLocal(fecha, hora_inicio);
    const disponibilidadFin = parseHoraLocal(fecha, hora_fin);

    // 3. Traer citas del especialista en esa fecha
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const { data: citas, error: errorCitas } = await Supabase.from("citas")
      .select("fecha_hora, duracion_min")
      .eq("especialista_id", especialistaId)
      .neq("estado", "cancelado")
      .gte("fecha_hora", inicioDia.toISOString())
      .lte("fecha_hora", finDia.toISOString());

    if (errorCitas) {
      console.error("Error al obtener citas:", errorCitas);
      return [];
    }

    // 4. Construir bloques ocupados
    const bloquesOcupados: { inicio: Date; fin: Date }[] = (citas || []).map(
      (cita) => {
        const inicio = new Date(cita.fecha_hora);
        const fin = new Date(inicio.getTime() + cita.duracion_min * 60000);
        return { inicio, fin };
      },
    );

    // Ordenar por inicio
    bloquesOcupados.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

    // 5. Calcular espacios libres reales
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

    // Si hay espacio después de la última cita
    if (cursor < disponibilidadFin) {
      espaciosLibres.push({ inicio: cursor, fin: disponibilidadFin });
    }

    // 6. Calcular turnos posibles dentro de los espacios libres
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

    return turnosDisponibles;
  }

  async darAltaCita(cita: CitaTurnos): Promise<RespuestaApi<CitaTurnos>> {
    try {
      const { data, error } = await Supabase.from("citas")
        .insert({
          fecha_hora: cita.fechaHora.toISOString(), // Supabase acepta ISO string
          duracion_min: cita.duracionMin,
          paciente_id: cita.pacienteId,
          especialista_id: cita.especialistaId,
          especialidad_id: cita.especialidadId,
          estado: cita.estado,
          comentario_paciente: cita.comentarioPaciente,
          comentario_especialista: cita.comentarioEspecialista,
          resenia: cita.resenia,
        })
        .select()
        .maybeSingle();

      if (error || !data) {
        console.error("Error al insertar cita:", error);
        return {
          success: false,
          message: "No se pudo registrar la cita",
          errorCode: error?.code ?? "insert_error",
        };
      }

      return {
        success: true,
        data: {
          ...cita,
          fechaHora: new Date(data.fecha_hora),
        },
      };
    } catch (e) {
      console.error("Excepción en darAltaCita:", e);
      return {
        success: false,
        message: "Ocurrió un error inesperado",
        errorCode: "unexpected_error",
      };
    }
  }

  async obtenerCitasConRegistro(): Promise<CitaCompletaTurnos[]> {
    // 1. Obtener las citas con datos de registro (vista)
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      "vista_citas_enteras",
    ).select("*");

    if (errorCitas)
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    if (!citasPlano) return [];

    // 2. Obtener todos los datos dinámicos
    const { data: datosDinamicos, error: errorDatos } = await Supabase.from(
      "datos_medicos_dinamicos",
    ).select("*");

    if (errorDatos)
      throw new Error(
        `Error al obtener datos dinámicos: ${errorDatos.message}`,
      );

    // 3. Agrupar datos dinámicos por cita_id
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

    // 4. Mapear al modelo final
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

  async obtenerCitasPaciente(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    // 1. Obtener las citas con datos de registro (vista)
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      "vista_citas_enteras",
    )
      .select("*")
      .eq("paciente_id", id_usuario);

    if (errorCitas)
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    if (!citasPlano) return [];

    // 2. Obtener todos los datos dinámicos
    const { data: datosDinamicos, error: errorDatos } = await Supabase.from(
      "datos_medicos_dinamicos",
    ).select("*");

    if (errorDatos)
      throw new Error(
        `Error al obtener datos dinámicos: ${errorDatos.message}`,
      );

    // 3. Agrupar datos dinámicos por cita_id
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

    // 4. Mapear al modelo final
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

  async cancelarCitaPaciente(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado === "completado") {
      return {
        success: false,
        message: "No se puede cancelar un turno ya realizado.",
      };
    }

    const { error } = await Supabase.from("citas")
      .update({
        estado: "cancelado",
        comentario_paciente: comentario,
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "Ocurrió un error al cancelar el turno.",
      };
    }

    return {
      success: true,
      message: "Turno cancelado exitosamente.",
      data: true,
    };
  }

  async cargarEncuesta(
    cita: CitaCompletaTurnos,
    encuesta: EncuestaTurnos,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado !== "completado") {
      return {
        success: false,
        message: "El turno debe ser realizado para poder cargar encuesta.",
      };
    }

    if (!cita.resenia || cita.resenia.trim() === "") {
      return {
        success: false,
        message:
          "El especialista debe cargar una reseña antes de poder cargar una encuesta",
      };
    }

    const { data, error } = await Supabase.from("encuesta")
      .insert({
        id: cita.citaId,
        pregunta1: encuesta.pregunta1,
        pregunta2: encuesta.pregunta2,
        pregunta3: encuesta.pregunta3,
        nombre: encuesta.nombre,
        telefono: encuesta.telefono,
      })
      .select()
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        message: "No se pudo registrar la encuesta",
        errorCode: error?.code ?? "insert_error",
      };
    }

    return {
      success: true,
      message: "Encuesta registrada exitosamente.",
      data: true,
    };
  }

  async cargarComentarioAtencion(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado !== "completado") {
      return {
        success: false,
        message:
          "El turno debe ser realizado para poder calificar la atencion.",
      };
    }

    const { error } = await Supabase.from("citas")
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
      message: "Antencion calificada exitosamente.",
      data: true,
    };
  }

  async cancelarCitaEspecialista(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    if (
      cita.estado === "completado" ||
      cita.estado === "aceptado" ||
      cita.estado === "rechazado"
    ) {
      return {
        success: false,
        message:
          "No se puede cancelar un turno ya realizado, aceptado o rechazado.",
      };
    }

    const { error } = await Supabase.from("citas")
      .update({
        estado: "cancelado",
        comentario_especialista: comentario,
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "Ocurrió un error al cancelar el turno.",
      };
    }

    return {
      success: true,
      message: "Turno cancelado exitosamente.",
      data: true,
    };
  }

  async rechazarCitaEspecialista(
    cita: CitaCompletaTurnos,
    comentario: string,
  ): Promise<RespuestaApi<boolean>> {
    if (
      cita.estado === "completado" ||
      cita.estado === "aceptado" ||
      cita.estado === "cancelado"
    ) {
      return {
        success: false,
        message:
          "No se puede rechazar un turno ya realizado, aceptado o cancelado.",
      };
    }

    const { error } = await Supabase.from("citas")
      .update({
        estado: "rechazado",
        comentario_especialista: comentario,
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "Ocurrió un error al rechazar el turno.",
      };
    }

    return {
      success: true,
      message: "Turno rechazado exitosamente.",
      data: true,
    };
  }

  async aceptarCitaEspecialista(
    cita: CitaCompletaTurnos,
  ): Promise<RespuestaApi<boolean>> {
    if (
      cita.estado === "completado" ||
      cita.estado === "rechazado" ||
      cita.estado === "cancelado"
    ) {
      return {
        success: false,
        message:
          "No se puede aceprtar un turno ya realizado, rechazado o cancelado.",
      };
    }

    const { error } = await Supabase.from("citas")
      .update({
        estado: "aceptado",
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "Ocurrió un error al aceptar el turno.",
      };
    }

    return {
      success: true,
      message: "Turno aceptado exitosamente.",
      data: true,
    };
  }

  async completarCitaEspecialista(
    cita: CitaCompletaTurnos,
    resenia: string,
  ): Promise<RespuestaApi<boolean>> {
    if (cita.estado !== "aceptado") {
      return {
        success: false,
        message: "No se puede finalizar un turno que no fue aceptado.",
      };
    }

    const { error } = await Supabase.from("citas")
      .update({
        estado: "completado",
        resenia: resenia,
      })
      .eq("id", cita.citaId);

    if (error) {
      return {
        success: false,
        message: "Ocurrió un error al completar el turno.",
      };
    }

    return {
      success: true,
      message: "Turno completado exitosamente.",
      data: true,
    };
  }

  async obtenerCitasEspecialista(
    id_usuario: number,
  ): Promise<CitaCompletaTurnos[]> {
    // 1. Obtener las citas con datos de registro (vista)
    const { data: citasPlano, error: errorCitas } = await Supabase.from(
      "vista_citas_enteras",
    )
      .select("*")
      .eq("especialista_id", id_usuario);

    if (errorCitas)
      throw new Error(`Error al obtener citas: ${errorCitas.message}`);
    if (!citasPlano) return [];

    // 2. Obtener todos los datos dinámicos
    const { data: datosDinamicos, error: errorDatos } = await Supabase.from(
      "datos_medicos_dinamicos",
    ).select("*");

    if (errorDatos)
      throw new Error(
        `Error al obtener datos dinámicos: ${errorDatos.message}`,
      );

    // 3. Agrupar datos dinámicos por cita_id
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

    // 4. Mapear al modelo final
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

    // Insertar en registros_medicos
    const { error: errorRegistro } = await Supabase.from(
      "registros_medicos",
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

    // Insertar datos médicos dinámicos (batch insert)
    const dinamicosFormateados = datosDinamicos.map((dato) => ({
      cita_id: registro.citaId,
      clave: dato.clave,
      valor: dato.valor,
    }));

    const { error: errorDinamicos } = await Supabase.from(
      "datos_medicos_dinamicos",
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
}
