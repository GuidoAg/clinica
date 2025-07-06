import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthSupabase } from '../../../services/auth-supabase';

@Component({
  selector: 'app-home-navbar',
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './home-navbar.html',
  styleUrl: './home-navbar.css',
})
export class HomeNavbar {
  sidebarOpen = true;

  constructor(
    private router: Router,
    private auth: AuthSupabase,
  ) {}

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

  clickCerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/welcome-page']);
  }

  navigate(ruta: string) {
    this.router.navigate([`/home/${ruta}`]);
  }
}
