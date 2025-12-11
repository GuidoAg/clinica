import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";
import { TranslocoModule } from "@jsverse/transloco";
import { trigger, style, transition, animate } from "@angular/animations";

@Component({
  selector: "app-perfil-admin",
  imports: [CommonModule, TrackImage, LoadingWrapper, TranslocoModule],
  templateUrl: "./perfil-admin.html",
  styleUrl: "./perfil-admin.css",
  animations: [
    trigger("slideInFromLeft", [
      transition(":enter", [
        style({
          transform: "translateX(150%)",
          opacity: 0,
        }),
        animate(
          "600ms cubic-bezier(0.35, 0, 0.25, 1)",
          style({
            transform: "translateX(0)",
            opacity: 1,
          }),
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
