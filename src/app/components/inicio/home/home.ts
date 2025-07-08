import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgClass],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  constructor(private loading: LoadingOverlayService) {}

  async ngOnInit(): Promise<void> {
    this.loading.hide();
  }

  usuario = {
    nombre: 'Guido',
    rol: 'Administrador',
  };

  estadisticas = [
    { titulo: 'Turnos hoy', valor: 14, color: 'bg-verde-oscuro' },
    { titulo: 'Pacientes activos', valor: 87, color: 'bg-azul-oscuro' },
    { titulo: 'Especialistas', valor: 9, color: 'bg-orange-500' },
    { titulo: 'Turnos cancelados', valor: 3, color: 'bg-red-500' },
  ];
}
