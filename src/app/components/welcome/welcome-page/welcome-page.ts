import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthSupabase } from "../../../services/auth-supabase";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { TrackImage } from "../../../directivas/track-image";
import { LoadingWrapper } from "../../loading-wrapper/loading-wrapper";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "app-welcome-page",
  imports: [
    MatIconModule,
    FormsModule,
    TrackImage,
    LoadingWrapper,
    TranslocoModule,
  ],
  templateUrl: "./welcome-page.html",
  styleUrl: "./welcome-page.css",
})
export class WelcomePage implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private authSupabase: AuthSupabase,
    private loading: LoadingOverlayService,
  ) {}

  async logout() {
    await this.authSupabase.logout();
    this.router.navigate(["/login"]);
  }

  opciones = [
    { icon: "local_hospital", labelKey: "welcomePage.opciones.consultas" },
    { icon: "medication", labelKey: "welcomePage.opciones.farmacia" },
    { icon: "event", labelKey: "welcomePage.opciones.turnos" },
    { icon: "support", labelKey: "welcomePage.opciones.ayuda" },
  ];

  carouselItems = [
    {
      img: "tarjeta1.jpg",
      tituloKey: "welcomePage.carrusel.guardias.titulo",
      descripcionKey: "welcomePage.carrusel.guardias.descripcion",
    },
    {
      img: "tarjeta2.jpg",
      tituloKey: "welcomePage.carrusel.cobertura.titulo",
      descripcionKey: "welcomePage.carrusel.cobertura.descripcion",
    },
    {
      img: "tarjeta3.jpg",
      tituloKey: "welcomePage.carrusel.turnos.titulo",
      descripcionKey: "welcomePage.carrusel.turnos.descripcion",
    },
    {
      img: "tarjeta4.jpg",
      tituloKey: "welcomePage.carrusel.descuentos.titulo",
      descripcionKey: "welcomePage.carrusel.descuentos.descripcion",
    },
    {
      img: "tarjeta5.jpg",
      tituloKey: "welcomePage.carrusel.pediatria.titulo",
      descripcionKey: "welcomePage.carrusel.pediatria.descripcion",
    },
    {
      img: "tarjeta6.jpg",
      tituloKey: "welcomePage.carrusel.estudios.titulo",
      descripcionKey: "welcomePage.carrusel.estudios.descripcion",
    },
  ];

  currentStartIndex = 0;
  visibleItems: any[] = [];
  intervalId: any;

  ngOnInit() {
    this.loading.show();
    this.updateVisibleItems();
    this.startAutoSlide();
    this.loading.hide();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  updateVisibleItems() {
    const total = this.carouselItems.length;
    this.visibleItems = [
      this.carouselItems[this.currentStartIndex % total],
      this.carouselItems[(this.currentStartIndex + 1) % total],
      this.carouselItems[(this.currentStartIndex + 2) % total],
    ];
  }

  nextSlide() {
    this.currentStartIndex =
      (this.currentStartIndex + 1) % this.carouselItems.length;
    this.updateVisibleItems();
  }

  prevSlide() {
    this.currentStartIndex =
      (this.currentStartIndex - 1 + this.carouselItems.length) %
      this.carouselItems.length;
    this.updateVisibleItems();
  }

  manualNextSlide() {
    this.nextSlide();
    this.resetAutoSlide();
  }

  manualPrevSlide() {
    this.prevSlide();
    this.resetAutoSlide();
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => this.nextSlide(), 4000);
  }

  resetAutoSlide() {
    clearInterval(this.intervalId);
    this.startAutoSlide();
  }

  clickRegister() {
    this.router.navigate(["/welcome-page/registro"]);
  }

  clickHome() {
    this.router.navigate(["/home"]);
  }

  clickPlanes() {
    this.router.navigate(["/welcome-page/planes"]);
  }
}
