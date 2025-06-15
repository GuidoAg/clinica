import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatSlideToggleModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  saludar(nombre: string) {
    console.log('Hola ' + nombre);
  }
}
