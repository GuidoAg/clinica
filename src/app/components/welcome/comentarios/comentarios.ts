
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-comentarios',
  imports: [MatIconModule, FormsModule, MatExpansionModule],
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css',
})
export class Comentarios {
  constructor(private router: Router) {}

  comentarios = [
    {
      nombre: 'María L.',
      texto: 'Excelente atención, muy humanos y profesionales.',
    },
    {
      nombre: 'Juan P.',
      texto: 'Siempre me atienden rápido y con una sonrisa.',
    },
    {
      nombre: 'Laura G.',
      texto: 'Me ayudaron con todo el trámite del reintegro, muy agradecida.',
    },
    {
      nombre: 'Sergio T.',
      texto: 'La pediatra fue súper amable con mi hija. 10 puntos.',
    },
    {
      nombre: 'Rocío D.',
      texto: 'Instalaciones limpias y modernas, me sentí muy cómoda.',
    },
    {
      nombre: 'Carlos M.',
      texto: 'Volvería sin dudar, atención muy profesional.',
    },
    {
      nombre: 'Paula V.',
      texto: 'Me atendieron un sábado sin turno, excelente predisposición.',
    },
    {
      nombre: 'Ignacio C.',
      texto: 'Servicio impecable, todo muy bien organizado.',
    },
    { nombre: 'Estela B.', texto: '¡Gracias por su atención y dedicación!' },
    { nombre: 'Nicolás F.', texto: 'Gran calidad humana en todo el personal.' },
    {
      nombre: 'Florencia S.',
      texto: 'La ginecóloga fue muy clara y empática.',
    },
    { nombre: 'Hernán R.', texto: 'Muy buena clínica, todo excelente.' },
    { nombre: 'Lucía A.', texto: 'Volvería sin dudas. Me sentí cuidada.' },
    {
      nombre: 'Matías K.',
      texto: 'Me resolvieron un problema que arrastraba hace meses.',
    },
    {
      nombre: 'Gabriela J.',
      texto: 'Todo el equipo fue muy atento y profesional.',
    },
    {
      nombre: 'Martín Q.',
      texto: 'Los resultados online me facilitaron todo.',
    },
    {
      nombre: 'Sabrina M.',
      texto: 'Excelente trato desde recepción hasta los médicos.',
    },
    { nombre: 'Jorge L.', texto: 'Agradecido por la atención que recibí.' },
    {
      nombre: 'Cecilia N.',
      texto: 'Me sentí como en casa, muy buena energía.',
    },
    {
      nombre: 'Ramiro E.',
      texto: 'Rápidos, amables y eficientes. Todo lo que uno espera.',
    },
  ];
}
