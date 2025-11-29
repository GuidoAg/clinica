import { Component, OnInit, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthSupabase } from "../../../../services/auth-supabase";
import { Usuario } from "../../../../models/Auth/Usuario";
import { Observable, firstValueFrom } from "rxjs";
import { LoadingOverlayService } from "../../../../services/loading-overlay-service";
import { TrackImage } from "../../../../directivas/track-image";
import { LoadingWrapper } from "../../../loading-wrapper/loading-wrapper";

@Component({
  selector: "app-perfil-admin",
  imports: [CommonModule, TrackImage, LoadingWrapper],
  templateUrl: "./perfil-admin.html",
  styleUrl: "./perfil-admin.css",
})
export class PerfilAdmin implements OnInit, AfterViewInit {
  usuario$: Observable<Usuario | null>;

  constructor(
    private authSupabase: AuthSupabase,
    private loading: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit(): Promise<void> {
    // Esperamos el primer valor emitido para el usuario
    const usuario = await firstValueFrom(this.usuario$);

    if (usuario) {
      console.log("Usuario cargado en ngOnInit:", usuario.urlImagenFondo);
    }
  }

  ngAfterViewInit(): void {
    // Aca Angular ya terminó de renderizar el DOM
    // Ocultamos el spinner ahora para asegurar que el contenido ya esté visible
    this.loading.hide();
  }
}
