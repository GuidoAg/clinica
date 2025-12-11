import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";
import { TranslocoModule } from "@jsverse/transloco";
import {
  trigger,
  style,
  transition,
  animate,
  keyframes,
} from "@angular/animations";

@Component({
  selector: "app-perfil-admin",
  imports: [CommonModule, TrackImage, LoadingWrapper, TranslocoModule],
  templateUrl: "./perfil-admin.html",
  styleUrl: "./perfil-admin.css",
  animations: [
    trigger("slideInFromLeft", [
      transition(":enter", [
        animate(
          "1400ms ease-in-out",
          keyframes([
            style({
              transform: "translateX(-200%) translateY(0)",
              opacity: 0,
              offset: 0,
            }),
            style({
              transform: "translateX(-150%) translateY(-40px)",
              opacity: 1,
              offset: 0.15,
            }),
            style({
              transform: "translateX(-120%) translateY(0)",
              opacity: 1,
              offset: 0.25,
            }),
            style({
              transform: "translateX(-90%) translateY(-30px)",
              opacity: 1,
              offset: 0.4,
            }),
            style({
              transform: "translateX(-60%) translateY(0)",
              opacity: 1,
              offset: 0.5,
            }),
            style({
              transform: "translateX(-40%) translateY(-20px)",
              opacity: 1,
              offset: 0.62,
            }),
            style({
              transform: "translateX(-20%) translateY(0)",
              opacity: 1,
              offset: 0.72,
            }),
            style({
              transform: "translateX(-10%) translateY(-10px)",
              opacity: 1,
              offset: 0.85,
            }),
            style({
              transform: "translateX(-3%) translateY(0)",
              opacity: 1,
              offset: 0.93,
            }),
            style({
              transform: "translateX(0) translateY(0)",
              opacity: 1,
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class PerfilAdmin implements OnInit {
  usuario$: Observable<Usuario | null>;
  mostrarContenido = false;

  constructor(
    private authSupabase: AuthSupabase,
    private loadingOverlay: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit(): Promise<void> {
    this.loadingOverlay.hide();
    const usuario = await firstValueFrom(this.usuario$);

    if (usuario) {
      console.log("Usuario cargado en ngOnInit:", usuario.urlImagenFondo);
    }

    // Activar la animación después de un pequeño delay
    setTimeout(() => {
      this.mostrarContenido = true;
    }, 100);
  }
}
