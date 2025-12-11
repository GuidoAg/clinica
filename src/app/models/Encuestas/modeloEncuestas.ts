export interface EncuestaPaciente {
  id: number;
  idPaciente: number;
  idEspecialista: number;
  idCita: number;
  especialidad: string;
  textBox: string;
  estrellas: number;
  radioButton: string;
  checkBox: string;
  rango: number;
  created_at: string;
}

export interface PuntuacionEspecialista {
  especialista: string;
  promedioEstrellas: number;
  totalEncuestas: number;
  promedioRango: number;
}

export interface EstadisticasEncuestas {
  total: number;
  promedioEstrellas: number;
  promedioRango: number;
  distribucionEstrellas: { estrellas: number; cantidad: number }[];
  distribucionRadio: { opcion: string; cantidad: number }[];
  aspectosDestacados: { aspecto: string; cantidad: number }[];
  mejoresComentarios: {
    comentario: string;
    estrellas: number;
    fecha: string;
    especialista: string;
  }[];
  peoresComentarios: {
    comentario: string;
    estrellas: number;
    fecha: string;
    especialista: string;
  }[];
  tendenciaGeneral: string;
  tasaRespuesta: number;
  citasCompletadas: number;
  encuestasRespondidas: number;
  puntuacionPorEspecialista: PuntuacionEspecialista[];
  visitasTotales: number;
}
