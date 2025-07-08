import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../models/Auth/Usuario';
import { UsuariosService } from '../../../services/usuarios';
import { AuthSupabase } from '../../../services/auth-supabase';
import { Subject } from 'rxjs';
import { AltasAdmin } from '../altas-admin/altas-admin';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, AltasAdmin],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})
export class Usuarios implements OnInit, OnDestroy {
  solapaActiva: 'pacientes' | 'especialistas' | 'administradores' = 'pacientes';

  pacientes: Usuario[] = [];
  especialistas: Usuario[] = [];
  administradores: Usuario[] = [];

  usuarioSeleccionado: Usuario | null = null;

  private destroy$ = new Subject<void>();

  mostrarPopupAltas = false;

  constructor(
    private usuariosService: UsuariosService,
    private authSupabase: AuthSupabase,
  ) {}

  ngOnInit(): void {
    this.recargarUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async recargarUsuarios(): Promise<void> {
    const todos = await this.usuariosService.obtenerTodosUsuarios();

    this.pacientes = todos.filter((u) => u.rol === 'paciente');
    this.especialistas = todos.filter((u) => u.rol === 'especialista');
    this.administradores = todos.filter((u) => u.rol === 'admin');
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
  }

  async toggleValidadoAdmin(usuario: Usuario): Promise<void> {
    if (usuario.rol !== 'especialista') return;

    const nuevoEstado = !usuario.validadoAdmin;
    const ok = await this.usuariosService.actualizarEstadoEspecialista(
      usuario.id,
      nuevoEstado,
    );

    if (ok) {
      usuario.validadoAdmin = nuevoEstado;
      await this.recargarUsuarios();
    }
  }

  abrirPopupAltas() {
    // if (!this.usuarioSeleccionado) {
    //   console.warn('No hay usuario cargado para mostrar horarios');
    //   return;
    // }
    this.mostrarPopupAltas = true;
  }

  cerrarPopupAltas() {
    this.mostrarPopupAltas = false;
  }
}
