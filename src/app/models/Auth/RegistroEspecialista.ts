export interface RegistroEspecialista {
  nombre: string;
  apellido: string;
  edad: string;
  dni: string;
  mail: string;
  contrasena: string;
  especialidades: string[]; // Array de especialidades (nombres o IDs)
  imagenPerfil: string;
}
