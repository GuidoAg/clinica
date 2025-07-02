import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {
  usuarios = [
    {
      nombre: 'Clara',
      apellido: 'Mendez',
      email: 'clara@clinica.com',
      perfil: 'especialista',
      activo: true,
      imagen: 'assets/imagenes/doctor1.png',
    },
    {
      nombre: 'Luis',
      apellido: 'Paz',
      email: 'luis@clinica.com',
      perfil: 'paciente',
      activo: true,
      imagen: 'assets/imagenes/paciente1.png',
    },
    {
      nombre: 'Marina',
      apellido: 'Vega',
      email: 'marina@clinica.com',
      perfil: 'administrador',
      activo: true,
      imagen: 'assets/imagenes/admin.png',
    },
  ];
}
