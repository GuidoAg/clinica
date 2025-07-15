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

export interface TurnosPorDia {
  fecha: string;
  cantidad: number;
}

export interface TurnosPorMedico {
  nombre: string;
  cantidad: number;
}
