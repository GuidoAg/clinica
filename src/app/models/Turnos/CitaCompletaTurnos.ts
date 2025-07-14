import { DatoDinamicoTurnos } from './DatoDinamicoTurnos';

export interface CitaCompletaTurnos {
  citaId: number;
  fechaHora: Date;
  duracionMin: number;
  estado: string;
  comentarioPaciente: string;
  comentarioEspecialista: string;
  resenia: string;

  pacienteId: number;
  especialistaId: number;
  especialidadId: number;

  pacienteNombreCompleto: string;
  especialistaNombreCompleto: string;
  especialidadNombre: string;

  alturaCm: number;
  pesoKg: number;
  temperaturaC: number;
  presionArterial: string;

  datosDinamicos: DatoDinamicoTurnos[];
}
