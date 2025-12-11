import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";
import { TranslocoModule } from "@jsverse/transloco";

@Component({
  selector: "app-perfil-admin",
  imports: [CommonModule, TrackImage, LoadingWrapper, TranslocoModule],
  templateUrl: "./perfil-admin.html",
  styleUrl: "./perfil-admin.css",
})
export class PerfilAdmin implements OnInit {
  usuario$: Observable<Usuario | null>;

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
  }
}
