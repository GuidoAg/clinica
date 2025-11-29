import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "app-ubicaciones",
  imports: [MatIconModule, FormsModule, MatExpansionModule, TranslocoModule],
  templateUrl: "./ubicaciones.html",
  styleUrl: "./ubicaciones.css",
})
export class Ubicaciones {
  constructor(private router: Router) {}

  sedes = [
    {
      nombre: "Centro Palermo",
      direccion: "Av. Santa Fe 3200, CABA",
      imagen: "assets/imagenes/ubicaciones/palermo.webp",
    },
    {
      nombre: "Centro Caballito",
      direccion: "Rivadavia 4800, CABA",
      imagen: "assets/imagenes/ubicaciones/caballito.webp",
    },
    {
      nombre: "Centro Belgrano",
      direccion: "Juramento 2100, CABA",
      imagen: "assets/imagenes/ubicaciones/belgrano.webp",
    },
    {
      nombre: "Centro Recoleta",
      direccion: "Av. Callao 1100, CABA",
      imagen: "assets/imagenes/ubicaciones/recoleta.webp",
    },
    {
      nombre: "Centro Villa Urquiza",
      direccion: "Av. Triunvirato 3900, CABA",
      imagen: "assets/imagenes/ubicaciones/urquiza.webp",
    },
    {
      nombre: "Centro Flores",
      direccion: "Av. Carabobo 200, CABA",
      imagen: "assets/imagenes/ubicaciones/flores.webp",
    },
  ];
}
