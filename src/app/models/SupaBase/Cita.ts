export interface Cita {
  id: string;
  pacienteId: string;
  especialistaId: string;
  especialidadId: number;
  fechaHora: string;
  duracionMin: number;
  estado: "solicitado" | "confirmado" | "cancelado" | "completado";
  creadoEn: string;
}
