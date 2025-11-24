import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "app-comentarios",
  imports: [MatIconModule, FormsModule, MatExpansionModule, TranslocoModule],
  templateUrl: "./comentarios.html",
  styleUrl: "./comentarios.css",
})
export class Comentarios {
  constructor(private router: Router) {}

  comentarios = [
    {
      nombreKey: "comentarios.items.comentario1.nombre",
      textoKey: "comentarios.items.comentario1.texto",
    },
    {
      nombreKey: "comentarios.items.comentario2.nombre",
      textoKey: "comentarios.items.comentario2.texto",
    },
    {
      nombreKey: "comentarios.items.comentario3.nombre",
      textoKey: "comentarios.items.comentario3.texto",
    },
    {
      nombreKey: "comentarios.items.comentario4.nombre",
      textoKey: "comentarios.items.comentario4.texto",
    },
    {
      nombreKey: "comentarios.items.comentario5.nombre",
      textoKey: "comentarios.items.comentario5.texto",
    },
    {
      nombreKey: "comentarios.items.comentario6.nombre",
      textoKey: "comentarios.items.comentario6.texto",
    },
    {
      nombreKey: "comentarios.items.comentario7.nombre",
      textoKey: "comentarios.items.comentario7.texto",
    },
    {
      nombreKey: "comentarios.items.comentario8.nombre",
      textoKey: "comentarios.items.comentario8.texto",
    },
    {
      nombreKey: "comentarios.items.comentario9.nombre",
      textoKey: "comentarios.items.comentario9.texto",
    },
    {
      nombreKey: "comentarios.items.comentario10.nombre",
      textoKey: "comentarios.items.comentario10.texto",
    },
    {
      nombreKey: "comentarios.items.comentario11.nombre",
      textoKey: "comentarios.items.comentario11.texto",
    },
    {
      nombreKey: "comentarios.items.comentario12.nombre",
      textoKey: "comentarios.items.comentario12.texto",
    },
    {
      nombreKey: "comentarios.items.comentario13.nombre",
      textoKey: "comentarios.items.comentario13.texto",
    },
    {
      nombreKey: "comentarios.items.comentario14.nombre",
      textoKey: "comentarios.items.comentario14.texto",
    },
    {
      nombreKey: "comentarios.items.comentario15.nombre",
      textoKey: "comentarios.items.comentario15.texto",
    },
    {
      nombreKey: "comentarios.items.comentario16.nombre",
      textoKey: "comentarios.items.comentario16.texto",
    },
    {
      nombreKey: "comentarios.items.comentario17.nombre",
      textoKey: "comentarios.items.comentario17.texto",
    },
    {
      nombreKey: "comentarios.items.comentario18.nombre",
      textoKey: "comentarios.items.comentario18.texto",
    },
    {
      nombreKey: "comentarios.items.comentario19.nombre",
      textoKey: "comentarios.items.comentario19.texto",
    },
    {
      nombreKey: "comentarios.items.comentario20.nombre",
      textoKey: "comentarios.items.comentario20.texto",
    },
  ];
}
