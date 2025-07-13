import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Captcha } from '../../models/captcha';
import { AuthSupabase } from '../../services/auth-supabase';
import sha256 from 'crypto-js/sha256';

@Component({
  selector: 'app-mi-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-captcha.html',
  styleUrl: './mi-captcha.css',
})
export class MiCaptcha {
  @Output() captchaResuelto = new EventEmitter<boolean>();

  private auth = inject(AuthSupabase);

  captchas: Captcha[] = [];
  captchaActual!: Captcha;
  userInput = '';
  captchaValido = false;
  mensajeVerificacion = '';
  verificando = false;
  cargado = false;

  async ngOnInit() {
    await this.cargarCaptchasDesdeSupabase();
  }

  async cargarCaptchasDesdeSupabase() {
    this.captchas = await this.auth.getCaptchas();

    if (!this.captchas.length) {
      console.error('No se pudieron cargar captchas');
      return;
    }

    this.captchaActual = this.obtenerCaptchaAleatorio();
    this.cargado = true;
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
    this.mensajeVerificacion = '';
    this.verificando = true;

    // Delay artificial de 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 500));

    const inputHash = sha256(this.userInput.trim().toLowerCase()).toString();
    this.captchaValido = inputHash === this.captchaActual.answerHash;

    this.mensajeVerificacion = this.captchaValido
      ? '✅ Respuesta correcta'
      : '❌ Respuesta incorrecta';

    this.verificando = false;
    this.captchaResuelto.emit(this.captchaValido);
  }

  cambiarCaptcha() {
    this.captchaActual = this.obtenerCaptchaAleatorio();
    this.userInput = '';
    this.mensajeVerificacion = '';
  }
}
