import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthSupabase } from '../../../services/auth-supabase';
import { Usuario } from '../../../models/Auth/Usuario';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoadingOverlayService } from '../../../services/loading-overlay-service';

@Component({
  selector: 'app-home-navbar',
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './home-navbar.html',
  styleUrl: './home-navbar.css',
})
export class HomeNavbar implements OnInit {
  sidebarOpen = true;
  usuario$: Observable<Usuario | null>;
  private usuarioActual: Usuario | null = null;

  constructor(
    private router: Router,
    private auth: AuthSupabase,
    private loadin: LoadingOverlayService,
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
    if (currentUrl === '/home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.router.navigate(['/home']).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
  }

  clickPerfil() {
    if (!this.usuarioActual) return;
    this.loadin.show();
    let rutaDestino = '';

    switch (this.usuarioActual.rol) {
      case 'paciente':
        rutaDestino = '/home/perfil-paciente';
        break;
      case 'especialista':
        rutaDestino = '/home/perfil-especialista';
        break;
      case 'admin':
        rutaDestino = '/home/perfil-admin';
        break;
      default:
        rutaDestino = '/home';
        break;
    }

    if (this.router.url === rutaDestino) {
      this.loadin.hide();
      return;
    }

    // ✅ Solo si la ruta es distinta
    this.router.navigate([rutaDestino]);
  }

  clickCerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/welcome-page']);
  }

  navigate(ruta: string) {
    this.router.navigate([`/home/${ruta}`]);
  }
}
