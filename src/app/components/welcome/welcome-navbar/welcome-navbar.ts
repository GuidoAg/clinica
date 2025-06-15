import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-welcome-navbar',
  imports: [RouterOutlet],
  templateUrl: './welcome-navbar.html',
  styleUrl: './welcome-navbar.css',
})
export class WelcomeNavbar {
  constructor(private router: Router) {}

  clickLogo() {
    const currentUrl = this.router.url;
    if (currentUrl === '/welcome-page') {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ← esto es lo vistoso
    } else {
      this.router.navigate(['/welcome-page']).then(() => {
        // Agregamos un pequeño delay para asegurar que el DOM esté cargado
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
  }

  clickLogin() {
    this.router.navigate(['/welcome-page/login']);
  }

  clickRegister() {
    this.router.navigate(['/welcome-page/registro']);
  }
}
