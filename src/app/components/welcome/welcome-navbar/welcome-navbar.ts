import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { RouterOutlet } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-welcome-navbar",
  imports: [RouterOutlet, TranslocoModule, MatIconModule, CommonModule],
  templateUrl: "./welcome-navbar.html",
  styleUrl: "./welcome-navbar.css",
})
export class WelcomeNavbar {
  showLanguageMenu = false;

  constructor(
    private router: Router,
    private translocoService: TranslocoService,
  ) {}

  changeLanguage(lang: string) {
    this.translocoService.setActiveLang(lang);
    localStorage.setItem("selectedLang", lang);
    this.showLanguageMenu = false;
  }

  get currentLang() {
    return this.translocoService.getActiveLang();
  }

  get currentLangDisplay() {
    const flags: Record<string, string> = {
      es: "🇦🇷 ES",
      en: "🇬🇧 EN",
      pt: "🇧🇷 PT",
    };
    return flags[this.currentLang] || "🇦🇷 ES";
  }

  toggleLanguageMenu() {
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  clickLogo() {
    const currentUrl = this.router.url;
    if (currentUrl === "/welcome-page") {
      window.scrollTo({ top: 0, behavior: "smooth" }); // ← esto es lo vistoso
    } else {
      this.router.navigate(["/welcome-page"]).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 100);
      });
    }
  }

  clickLogin() {
    this.router.navigate(["/welcome-page/login"]);
  }

  clickPlanes() {
    this.router.navigate(["/welcome-page/planes"]);
  }

  clickRegister() {
    this.router.navigate(["/welcome-page/registro"]).then(() => {
      setTimeout(() => {
        window.location.reload();
      }, 1);
    });
  }
}
