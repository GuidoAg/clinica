import { Injectable } from '@angular/core';
import { Supabase } from '../supabase';
import { EspecialistaTurnos } from '../models/Turnos/EspecialistaTurnos';
import { EspecialidadTurnos } from '../models/Turnos/EspecialidadTurnos';
import { CitaTurnos } from '../models/Turnos/CitaTurnos';
import { RespuestaApi } from '../models/RespuestaApi';

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
  providedIn: 'root',
})
export class Turnos {
  constructor() {}

  async obtenerEspecialistas(): Promise<EspecialistaTurnos[]> {
    const { data: perfiles, error } = await Supabase.from(
      'vista_perfiles_con_email',
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
      .eq('rol', 'especialista')
      .eq('email_verificado_real', true);

    if (error || !perfiles) {
      console.error('Error al obtener usuarios:', error);
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
      'vista_especialista_especialidades',
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
      .eq('especialista_id', idEspecialista);

    if (error || !especialidades) {
      console.error('Error al obtener usuarios:', error);
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
    const { data: dias, error } = await Supabase.from('disponibilidades')
      .select('dia_semana')
      .eq('perfil_id', idEspecialista)
      .eq('habilitado', true);

    if (error || !dias) {
      console.error('Error al obtener días disponibles:', error);
      return [];
    }

    const diasSemanaMap: Record<number, string> = {
      1: 'lunes',
      2: 'martes',
      3: 'miércoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sábado',
      7: 'domingo',
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
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
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
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Correctamente en zona local

    const diaSemana = ((date.getDay() + 6) % 7) + 1;
    // getDay() => 0=Domingo ... 6=Sábado
    // El cálculo lo convierte a 1=Lunes ... 7=Domingo

    // 2. Traer disponibilidad del especialista para ese día
    const { data: disponibilidad, error: errorDisp } = await Supabase.from(
      'disponibilidades',
    )
      .select('hora_inicio, hora_fin')
      .eq('perfil_id', especialistaId)
      .eq('dia_semana', diaSemana)
      .eq('habilitado', true)
      .maybeSingle();

    console.log(disponibilidad, fecha, especialistaId, duracion, diaSemana);
    if (errorDisp || !disponibilidad) {
      console.error('Sin disponibilidad:', errorDisp);
      return [];
    }

    const { hora_inicio, hora_fin } = disponibilidad;

    function parseHoraLocal(fecha: string, hora: string): Date {
      const [year, month, day] = fecha.split('-').map(Number);
      const [hour, minute] = hora.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }

    const disponibilidadInicio = parseHoraLocal(fecha, hora_inicio);
    const disponibilidadFin = parseHoraLocal(fecha, hora_fin);

    // 3. Traer citas del especialista en esa fecha
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);

    const { data: citas, error: errorCitas } = await Supabase.from('citas')
      .select('fecha_hora, duracion_min')
      .eq('especialista_id', especialistaId)
      .neq('estado', 'cancelado')
      .gte('fecha_hora', inicioDia.toISOString())
      .lte('fecha_hora', finDia.toISOString());

    if (errorCitas) {
      console.error('Error al obtener citas:', errorCitas);
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
          horaTurno.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
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
      const { data, error } = await Supabase.from('citas')
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
        console.error('Error al insertar cita:', error);
        return {
          success: false,
          message: 'No se pudo registrar la cita',
          errorCode: error?.code ?? 'insert_error',
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
      console.error('Excepción en darAltaCita:', e);
      return {
        success: false,
        message: 'Ocurrió un error inesperado',
        errorCode: 'unexpected_error',
      };
    }
  }
}
