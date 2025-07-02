import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  usuario = {
    nombre: 'Guido',
    apellido: 'Insua',
    email: 'guido@clinica.com',
    imagen: 'assets/imagenes/avatar.png',
    perfil: 'especialista', // o 'paciente'
    especialidades: ['Clínica Médica', 'Cardiología'],
  };
}
