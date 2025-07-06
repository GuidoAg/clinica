export interface Cita {
  id: string;
  pacienteId: string;
  especialistaId: string;
  especialidadId: number;
  fechaHora: string;
  duracionMin: number;
  estado: 'solicitado' | 'confirmado' | 'cancelado' | 'completado'; // adaptá el enum según tu tipo_estado_cita
  creadoEn: string;
}
