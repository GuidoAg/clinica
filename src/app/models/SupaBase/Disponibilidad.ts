export interface Disponibilidad {
  id: number;
  perfilId: string;
  diaSemana: number; // 1 = lunes ... 7 = domingo
  horaInicio: string; // formato "HH:mm:ss"
  horaFin: string; // formato "HH:mm:ss"
}
