import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthSupabase } from '../../../services/auth-supabase';
import { Usuario } from '../../../models/Auth/Usuario';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  usuario$: Observable<Usuario | null>;

  constructor(private authSupabase: AuthSupabase) {
    this.usuario$ = this.authSupabase.user$;
  }
}
