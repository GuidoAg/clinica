export interface Usuario {
  id: string;
  email: string;
  rol: 'paciente' | 'especialista' | 'admin';
  nombre: string;
  apellido: string;
  edad?: number;
  dni?: string;
  fotoPerfilUrl?: string;
}
