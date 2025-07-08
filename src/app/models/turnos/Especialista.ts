import { EspecialidadExtendida } from './EspecialidadExtendida';

export interface Especialista {
  especialista_id: number;
  nombre: string;
  apellido: string;
  url_imagen_perfil: string;
  especialidades: EspecialidadExtendida[];
  disponibilidades: {
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    duracion_minutos: number;
  }[];
}
