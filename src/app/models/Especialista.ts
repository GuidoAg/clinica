import { Usuario } from './Usuario';
import { Especialidad } from './Especialidad';
import { DisponibilidadSemanal } from './DisponibilidadHoraria';

export interface Especialista extends Usuario {
  estaActivo: boolean;
  especialidades: Especialidad[];
  disponibilidadPorDia: DisponibilidadSemanal;
}
