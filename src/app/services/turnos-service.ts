// import { Injectable, inject } from '@angular/core';
// import { Supabase } from '../supabase';
// import { Especialista } from '../models/turnos/Especialista';
// import { AuthSupabase } from './auth-supabase';
// import { Especialidad } from '../models/especialidad';

// export interface EspecialidadExtendida extends Especialidad {
//   duracion_minutos: number;
// }

// export interface SlotDisponible {
//   horaInicio: string;
//   horaFin: string;
// }

// export interface TurnoReservaPayload {
//   especialistaId: number;
//   especialidadId: number;
//   fechaHora: Date;
// }

// @Injectable({ providedIn: 'root' })
// export class TurnosService {
//   private auth = inject(AuthSupabase);

//   // async obtenerEspecialidades(): Promise<Especialidad[]> {
//   //   const { data, error } = await Supabase.from('especialidades')
//   //     .select('id, nombre, url_icono')
//   //     .order('nombre', { ascending: true });

//   //   if (error || !data) {
//   //     console.error('Error al obtener especialidades:', error);
//   //     return [];
//   //   }

//     // return data.map((e) => ({
//     //   id: e.id,
//     //   nombre: e.nombre,
//     //   urlIcono: e.url_icono ?? undefined,
//     // }));
//   }

//   async obtenerEspecialistasPorEspecialidad(
//     especialidadId: number,
//   ): Promise<Especialista[]> {
//     const { data, error } = await Supabase.from('vista_especialistas_full')
//       .select('*')
//       .contains('especialidades', [{ especialidad_id: especialidadId }]);

//     if (error || !data) {
//       console.error('Error al obtener especialistas:', error);
//       return [];
//     }

//     return data;
//   }

//   async obtenerSlotsDisponibles(
//     especialistaId: number,
//     especialidadId: number,
//     fecha: Date,
//   ): Promise<SlotDisponible[]> {
//     const diaSemana = ((fecha.getDay() + 6) % 7) + 1; // 1 = lunes ... 7 = domingo

//     // Traer disponibilidad para ese día
//     const { data: disponibilidad, error } = await Supabase.from(
//       'vista_disponibilidad_con_duracion',
//     )
//       .select('*')
//       .eq('especialista_id', especialistaId)
//       .eq('especialidad_id', especialidadId)
//       .eq('dia_semana', diaSemana)
//       .maybeSingle();

//     if (error || !disponibilidad) {
//       return [];
//     }

//     const slots = this.generarSlots(
//       disponibilidad.hora_inicio,
//       disponibilidad.hora_fin,
//       disponibilidad.duracion_minutos,
//     );

//     // Obtener citas ya tomadas en ese día
//     const inicioDia = new Date(fecha);
//     inicioDia.setHours(0, 0, 0, 0);
//     const finDia = new Date(fecha);
//     finDia.setHours(23, 59, 59, 999);

//     const { data: citas, error: errorCitas } = await Supabase.from('citas')
//       .select('fecha_hora')
//       .eq('especialista_id', especialistaId)
//       .eq('especialidad_id', especialidadId)
//       .gte('fecha_hora', inicioDia.toISOString())
//       .lte('fecha_hora', finDia.toISOString());

//     if (errorCitas) {
//       console.error('Error al obtener citas:', errorCitas);
//       return slots; // mostramos todos igual si no se pudo filtrar
//     }

//     const ocupadas = new Set(
//       citas?.map((c) => new Date(c.fecha_hora).toISOString().slice(11, 16)), // 'HH:MM'
//     );

//     return slots.filter((s) => !ocupadas.has(s.horaInicio));
//   }

//   async reservarTurno(payload: TurnoReservaPayload): Promise<boolean> {
//     const pacienteId = this.auth.getCurrentUser()?.id;

//     if (!pacienteId) {
//       console.error('Usuario no autenticado');
//       return false;
//     }

//     const { error } = await Supabase.from('citas').insert({
//       fecha_hora: payload.fechaHora.toISOString(),
//       especialista_id: payload.especialistaId,
//       especialidad_id: payload.especialidadId,
//       paciente_id: pacienteId,
//       duracion_min: 30, // Podés hacerlo dinámico más adelante
//       estado: 'pendiente',
//     });

//     if (error) {
//       console.error('Error al reservar turno:', error);
//       return false;
//     }

//     return true;
//   }

//   private generarSlots(
//     horaInicio: string,
//     horaFin: string,
//     duracion: number,
//   ): SlotDisponible[] {
//     const [hIni, mIni] = horaInicio.split(':').map(Number);
//     const [hFin, mFin] = horaFin.split(':').map(Number);

//     const inicioMin = hIni * 60 + mIni;
//     const finMin = hFin * 60 + mFin;

//     const slots: SlotDisponible[] = [];

//     for (let min = inicioMin; min + duracion <= finMin; min += duracion) {
//       const h1 = Math.floor(min / 60)
//         .toString()
//         .padStart(2, '0');
//       const m1 = (min % 60).toString().padStart(2, '0');
//       const h2 = Math.floor((min + duracion) / 60)
//         .toString()
//         .padStart(2, '0');
//       const m2 = ((min + duracion) % 60).toString().padStart(2, '0');

//       slots.push({
//         horaInicio: `${h1}:${m1}`,
//         horaFin: `${h2}:${m2}`,
//       });
//     }

//     return slots;
//   }
// }
