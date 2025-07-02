import { RangoHorario } from './RangoHorario';

export interface DisponibilidadSemanal {
  [dia: number]: RangoHorario[]; // 1 (lunes) ... 7 (domingo)
}
