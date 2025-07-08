export interface DisponibilidadVisual {
  dia: number; // 1 (lunes) a 7 (domingo)
  habilitado: boolean;
  horaDesde: string; // Ej: '08:30'
  horaHasta: string; // Ej: '17:00'
}
