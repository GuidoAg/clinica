import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-preguntas',
  imports: [MatIconModule, CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './preguntas.html',
  styleUrl: './preguntas.css',
})
export class Preguntas {
  constructor(private router: Router) {}

  preguntas = [
    {
      pregunta: '¿Cuáles son los horarios de atención?',
      respuesta:
        'Atendemos de lunes a viernes de 8:00 a 20:00, y sábados de 9:00 a 13:00.',
    },
    {
      pregunta: '¿Cómo saco un turno?',
      respuesta:
        'Podés sacar turno por nuestra web, por teléfono o presencialmente en recepción.',
    },
    {
      pregunta: '¿Atienden por obras sociales?',
      respuesta:
        'Sí, trabajamos con las principales obras sociales y prepagas.',
    },
    {
      pregunta: '¿Puedo hacerme estudios sin turno?',
      respuesta:
        'Algunos estudios simples pueden hacerse sin turno. Consultá previamente.',
    },
    {
      pregunta: '¿Ofrecen reintegros?',
      respuesta:
        'Sí, según tu cobertura médica, podés solicitar reintegros con la factura correspondiente.',
    },
    {
      pregunta: '¿Qué especialidades médicas tienen?',
      respuesta:
        'Contamos con más de 20 especialidades incluyendo clínica, pediatría, ginecología, cardiología, entre otras.',
    },
    {
      pregunta: '¿Tienen servicio de urgencias?',
      respuesta:
        'Sí, contamos con atención de urgencias 24/7 en nuestra sede central.',
    },
    {
      pregunta: '¿Cómo obtengo mis resultados?',
      respuesta:
        'Podés verlos en nuestro portal web o retirarlos en persona con tu DNI.',
    },
    {
      pregunta: '¿Se puede pagar con tarjeta?',
      respuesta:
        'Sí, aceptamos todos los medios de pago: débito, crédito, efectivo y billeteras digitales.',
    },
    {
      pregunta: '¿Dónde puedo hacer reclamos o sugerencias?',
      respuesta:
        'En nuestra web, sección "Contacto", o en recepción de cualquier sede.',
    },
  ];
}
