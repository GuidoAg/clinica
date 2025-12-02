import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { RouterOutlet } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { AuthSupabase } from "../../../services/auth-supabase";
import { Usuario } from "../../../models/Auth/Usuario";
import { Observable } from "rxjs";
import { LoadingOverlayService } from "../../../services/loading-overlay-service";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-home-navbar",
  imports: [
    RouterOutlet,
    MatIconModule,
    FormsModule,
    TranslocoModule,
    CommonModule,
  ],
  templateUrl: "./home-navbar.html",
  styleUrl: "./home-navbar.css",
})
export class HomeNavbar implements OnInit {
  sidebarOpen = true;
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  showLanguageMenu = false;

  constructor(
    private router: Router,
    private auth: AuthSupabase,
    private loadin: LoadingOverlayService,
    private translocoService: TranslocoService,
  ) {
    this.usuario$ = this.auth.user$;
  }

  ngOnInit(): void {
    this.loadin.show();
    this.usuario$.subscribe((usuario: Usuario | null) => {
      this.usuarioActual = usuario;
    });
    this.loadin.hide();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  clickLogo() {
    const currentUrl = this.router.url;
    if (currentUrl === "/home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      this.router.navigate(["/home"]).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      });
    }
  }

  clickSolicitarTurno() {
    if (!this.usuarioActual) return;
    this.loadin.show();

    if (this.router.url === "/home/solicitar-turnos") {
      this.loadin.hide();
      return;
    }

    this.router.navigate(["/home/solicitar-turnos"]);
  }

  clickSolicitarTurnoAdmin() {
    if (!this.usuarioActual) return;
    this.loadin.show();

    if (this.router.url === "/home/solicitar-turnos-admin") {
      this.loadin.hide();
      return;
    }

    this.router.navigate(["/home/solicitar-turnos-admin"]);
  }

  clickUsuario() {
    if (!this.usuarioActual) return;
    this.loadin.show();

    if (this.router.url === "/home/usuarios") {
      this.loadin.hide();
      return;
    }

    this.router.navigate(["/home/usuarios"]);
  }

  clickPerfil() {
    if (!this.usuarioActual) return;
    this.loadin.show();
    let rutaDestino = "";

    switch (this.usuarioActual.rol) {
      case "paciente":
        rutaDestino = "/home/perfil-paciente";
        break;
      case "especialista":
        rutaDestino = "/home/perfil-especialista";
        break;
      case "admin":
        rutaDestino = "/home/perfil-admin";
        break;
      default:
        rutaDestino = "/home";
        break;
    }

    if (this.router.url === rutaDestino) {
      this.loadin.hide();
      return;
    }

    this.router.navigate([rutaDestino]);
  }

  clickCerrarSesion() {
    this.auth.logout();
    this.router.navigate(["/welcome-page"]);
  }

  navigate(ruta: string) {
    this.router.navigate([`/home/${ruta}`]);
  }

  changeLanguage(lang: string) {
    this.translocoService.setActiveLang(lang);
    localStorage.setItem("selectedLang", lang);
    this.showLanguageMenu = false;
  }

  get currentLang(): string {
    return this.translocoService.getActiveLang();
  }

  get currentLangDisplay(): string {
    const flags: Record<string, string> = {
      es: "🇦🇷 ES",
      en: "🇺🇸 EN",
      pt: "🇧🇷 PT",
    };
    return flags[this.currentLang] || "🇦🇷 ES";
  }

  toggleLanguageMenu() {
    this.showLanguageMenu = !this.showLanguageMenu;
  }
}
