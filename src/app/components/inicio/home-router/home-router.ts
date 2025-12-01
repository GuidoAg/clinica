import { Component, AfterViewInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable } from "rxjs";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { Home } from "../home/home";
import { Entrada } from "../entrada/entrada";

@Component({
  selector: "app-home-router",
  standalone: true,
  imports: [CommonModule, Home, Entrada],
  template: `
    @if (usuario$ | async; as usuario) {
      @if (usuario.rol === "admin") {
        <app-home />
      } @else {
        <app-entrada />
      }
    }
  `,
})
export class HomeRouter implements AfterViewInit {
  usuario$: Observable<Usuario | null>;
  private loading = inject(LoadingOverlayService);

  constructor(private authSupabase: AuthSupabase) {
    this.usuario$ = this.authSupabase.user$;
  }

  ngAfterViewInit(): void {
    // Ocultamos el spinner después de que la vista esté completamente renderizada
    setTimeout(() => {
      this.loading.hide();
    }, 0);
  }
}
