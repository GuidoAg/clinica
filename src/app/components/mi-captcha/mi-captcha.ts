import { Component, Output, EventEmitter, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Captcha } from "../../models/captcha";
import { AuthSupabase } from "../../services/auth-supabase";

@Component({
  selector: "app-mi-captcha",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./mi-captcha.html",
  styleUrl: "./mi-captcha.css",
})
export class MiCaptcha implements OnInit {
  @Output() captchaResuelto = new EventEmitter<boolean>();

  private auth = inject(AuthSupabase);

  captchas: Captcha[] = [];
  captchaActual: Captcha | undefined;
  userInput = "";
  captchaValido = false;
  mensajeVerificacion = "";
  verificando = false;
  cargado = false;
  captchaActivo = true; // Switch para activar/desactivar el captcha

  async ngOnInit() {
    await this.cargarCaptchasDesdeSupabase();
  }

  async cargarCaptchasDesdeSupabase() {
    try {
      this.captchas = await this.auth.getCaptchas();

      if (!this.captchas.length) {
        console.error("No se pudieron cargar captchas");
        return;
      }

      this.captchaActual = this.obtenerCaptchaAleatorio();
      this.cargado = true;
    } catch (error) {
      console.error("Error al cargar captchas:", error);
      this.cargado = false;
    }
  }

  obtenerCaptchaAleatorio(): Captcha {
    if (this.captchas.length < 2) return this.captchas[0];

    let nuevo: Captcha;
    do {
      const index = Math.floor(Math.random() * this.captchas.length);
      nuevo = this.captchas[index];
    } while (nuevo === this.captchaActual); // evita repetir el actual

    return nuevo;
  }

  async verificarRespuesta() {
    if (!this.captchaActual) return;

    // Si el captcha está desactivado, siempre emite true
    if (!this.captchaActivo) {
      this.captchaValido = true;
      this.mensajeVerificacion = "Captcha desactivado - Verificación omitida";
      this.captchaResuelto.emit(true);
      return;
    }

    this.mensajeVerificacion = "";
    this.verificando = true;

    // Delay artificial de 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 500));

    const inputHash = await this.sha256(this.userInput.trim().toLowerCase());
    this.captchaValido = inputHash === this.captchaActual.answerHash;

    this.mensajeVerificacion = this.captchaValido
      ? "Respuesta correcta"
      : "Respuesta incorrecta";

    this.verificando = false;
    this.captchaResuelto.emit(this.captchaValido);
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  cambiarCaptcha() {
    this.captchaActual = this.obtenerCaptchaAleatorio();
    this.userInput = "";
    this.mensajeVerificacion = "";
  }

  toggleCaptcha() {
    this.captchaActivo = !this.captchaActivo;
    this.userInput = "";
    this.mensajeVerificacion = "";
  }
}
