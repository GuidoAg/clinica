import { Usuario } from './Usuario';

export interface Paciente extends Usuario {
  obraSocial: string;
  imagenFondoUrl: string;
}
