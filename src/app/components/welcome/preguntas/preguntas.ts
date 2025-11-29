import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "app-preguntas",
  imports: [MatIconModule, FormsModule, MatExpansionModule, TranslocoModule],
  templateUrl: "./preguntas.html",
  styleUrl: "./preguntas.css",
})
export class Preguntas {
  constructor(private router: Router) {}

  preguntas = [
    {
      preguntaKey: "preguntas.items.horarios.pregunta",
      respuestaKey: "preguntas.items.horarios.respuesta",
    },
    {
      preguntaKey: "preguntas.items.turno.pregunta",
      respuestaKey: "preguntas.items.turno.respuesta",
    },
    {
      preguntaKey: "preguntas.items.obrasSociales.pregunta",
      respuestaKey: "preguntas.items.obrasSociales.respuesta",
    },
    {
      preguntaKey: "preguntas.items.estudios.pregunta",
      respuestaKey: "preguntas.items.estudios.respuesta",
    },
    {
      preguntaKey: "preguntas.items.reintegros.pregunta",
      respuestaKey: "preguntas.items.reintegros.respuesta",
    },
    {
      preguntaKey: "preguntas.items.especialidades.pregunta",
      respuestaKey: "preguntas.items.especialidades.respuesta",
    },
    {
      preguntaKey: "preguntas.items.urgencias.pregunta",
      respuestaKey: "preguntas.items.urgencias.respuesta",
    },
    {
      preguntaKey: "preguntas.items.resultados.pregunta",
      respuestaKey: "preguntas.items.resultados.respuesta",
    },
    {
      preguntaKey: "preguntas.items.pago.pregunta",
      respuestaKey: "preguntas.items.pago.respuesta",
    },
    {
      preguntaKey: "preguntas.items.reclamos.pregunta",
      respuestaKey: "preguntas.items.reclamos.respuesta",
    },
  ];
}
