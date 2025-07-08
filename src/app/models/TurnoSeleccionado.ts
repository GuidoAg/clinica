interface TurnoSeleccionado {
  especialidadId: number;
  especialistaId: number;
  fecha: Date; // Día
  slot: {
    horaInicio: string; // '09:00'
    horaFin: string; // '09:30'
  };
}
