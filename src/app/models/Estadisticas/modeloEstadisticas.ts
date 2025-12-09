export interface Ingreso {
  fecha: string;
  nombre: string;
  apellido: string;
  rol: string;
}

export interface TurnosPorEspecialidad {
  especialidad: string;
  cantidad: number;
}

export interface PacientesPorEspecialidad {
  especialidad: string;
  cantidad: number;
}

export interface MedicosPorEspecialidad {
  especialidad: string;
  cantidad: number;
}

export interface TurnosPorDia {
  fecha: string;
  cantidad: number;
}

export interface TurnosPorMedico {
  nombre: string;
  cantidad: number;
}

export interface CitasPorEstado {
  estado: string;
  cantidad: number;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
}

export interface IngresosPorHora {
  fecha_hora: string;
  cantidad: number;
}

export interface TrendLineData {
  datos: IngresosPorHora[];
  maxY: number;
}
