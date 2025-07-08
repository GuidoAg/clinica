import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthSupabase } from '../../../../services/auth-supabase';
import { Usuario } from '../../../../models/Auth/Usuario';
import { Observable, firstValueFrom } from 'rxjs';
import { LoadingOverlayService } from '../../../../services/loading-overlay-service';
import { FormatoDniPipe } from '../../../../pipes/formato-dni-pipe';
import { FormatoBoolSiNOPipe } from '../../../../pipes/formato-bool-si-no-pipe';
import { Horarios } from '../../horarios/horarios';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-especialista',
  imports: [
    CommonModule,
    FormatoDniPipe,
    FormatoBoolSiNOPipe,
    Horarios,
    FormsModule,
  ],
  templateUrl: './perfil-especialista.html',
  styleUrl: './perfil-especialista.css',
})
export class PerfilEspecialista implements OnInit, AfterViewInit {
  guardarDuracion(_t32: {
    id: number;
    nombre: string;
    urlIcono?: string;
    duracion?: number;
  }) {
    throw new Error('Method not implemented.');
  }
  usuario$: Observable<Usuario | null>;
  usuarioActual: Usuario | null = null;
  mostrarPopupHorarios = false;

  constructor(
    private authSupabase: AuthSupabase,
    private loading: LoadingOverlayService,
  ) {
    this.usuario$ = this.authSupabase.user$;
  }

  async ngOnInit() {
    const usuario = await firstValueFrom(this.usuario$);
    if (usuario) {
      // Convertir id a número si es string
      usuario.id =
        typeof usuario.id === 'string' ? Number(usuario.id) : usuario.id;
      this.usuarioActual = usuario;
    }
  }

  ngAfterViewInit(): void {
    this.loading.hide();
  }

  abrirPopupHorarios() {
    if (!this.usuarioActual) {
      console.warn('No hay usuario cargado para mostrar horarios');
      return;
    }
    this.mostrarPopupHorarios = true;
  }

  cerrarPopupHorarios() {
    this.mostrarPopupHorarios = false;
  }
}
