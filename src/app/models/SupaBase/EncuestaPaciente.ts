export interface EncuestaPaciente {
  id: number;
  createdAt: string;
  idPaciente: number | null;
  idEspecialista: number | null;
  idCita: number | null;
  especialidad: string | null;
  textBox: string | null;
  estrellas: number | null;
  radioButton: string | null;
  checkBox: string | null;
  rango: number | null;
}
