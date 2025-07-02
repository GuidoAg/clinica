import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegistroPaciente } from '../models/Auth/RegistroPaciente';
import { Supabase } from '../supabase';
import { RegistroEspecialista } from '../models/Auth/RegistroEspecialista';
import { AuthRespuesta } from '../models/Auth/AuthRespuesta';

export type UsuarioBase = {
  id: string;
  user_id: string;
  role: 'paciente' | 'especialista';
  first_name: string;
  last_name: string;
  age: number;
  dni: string;
  email_verified: boolean;
  profile_image_url: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthSupabase {
  private userDataSubject = new BehaviorSubject<UsuarioBase | null>(null);
  readonly userData$ = this.userDataSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  async registrarPaciente(dto: RegistroPaciente): Promise<AuthRespuesta> {
    const { data, error } = await Supabase.auth.signUp({
      email: dto.mail,
      password: dto.contrasena,
    });

    if (data.user?.identities?.length === 0) {
      return {
        exito: false,
        error: 'Este correo ya está registrado. Por favor, usa otro.',
      };
    }

    if (error || !data.user) {
      return {
        exito: false,
        error: error?.message || 'No se pudo registrar el usuario.',
      };
    }

    const userId = data.user?.id;
    const { data: perfil, error: perfilError } = await Supabase.from('profiles')
      .insert({
        user_id: userId,
        role: 'paciente',
        first_name: dto.nombre,
        last_name: dto.apellido,
        age: Number(dto.edad),
        dni: dto.dni,
        email_verified: false,
        profile_image_url: dto.imagenPerfil,
      })
      .select('id')
      .single();

    if (perfilError) {
      if (perfilError.message.toLowerCase().includes('duplicate key value')) {
        return {
          exito: false,
          error: 'Error, el mail ya fue utilizado pero en espera de validacion',
        };
      } else {
        return {
          exito: false,
          error: 'Error al guardar perfil del especialista.',
        };
      }
    }

    const { error: detallesError } = await Supabase.from(
      'patient_details',
    ).insert({
      profile_id: perfil.id,
      obra_social: dto.obraSocial,
    });

    if (detallesError)
      return { exito: false, error: 'Error al guardar datos del paciente.' };

    return { exito: true };
  }

  async registrarEspecialista(
    dto: RegistroEspecialista,
  ): Promise<AuthRespuesta> {
    const { data, error } = await Supabase.auth.signUp({
      email: dto.mail,
      password: dto.contrasena,
    });

    if (error) return { exito: false, error: error.message };
    if (data.user?.identities?.length === 0) {
      return {
        exito: false,
        error: 'Este correo ya está registrado. Por favor, usa otro.',
      };
    }

    const userId = data.user?.id;

    // Insert perfil
    const { data: perfil, error: perfilError } = await Supabase.from('profiles')
      .insert({
        user_id: userId,
        role: 'especialista',
        first_name: dto.nombre,
        last_name: dto.apellido,
        age: Number(dto.edad),
        dni: dto.dni,
        email_verified: false,
        profile_image_url: dto.imagenPerfil,
      })
      .select('id')
      .single();

    if (perfilError) {
      if (perfilError.message.toLowerCase().includes('duplicate key value')) {
        return {
          exito: false,
          error: 'Error, el mail ya fue utilizado pero en espera de validacion',
        };
      } else {
        return {
          exito: false,
          error: 'Error al guardar perfil del especialista.',
        };
      }
    }

    const profileId = perfil.id;

    // Insert detalles
    const { error: detallesError } = await Supabase.from(
      'specialist_details',
    ).insert({ profile_id: profileId });

    if (detallesError)
      return {
        exito: false,
        error: 'Error al guardar detalles del especialista.',
      };

    // Buscar o crear especialidad
    const especialidadNombre = dto.especialidad.trim().toLowerCase();

    const { data: especialidadExistente, error: buscarError } =
      await Supabase.from('specialties')
        .select('id, name')
        .filter('name', 'ilike', especialidadNombre)
        .maybeSingle();

    let especialidadId: number | null = null;

    if (buscarError) {
      return { exito: false, error: 'Error al buscar especialidad.' };
    }

    if (especialidadExistente) {
      especialidadId = especialidadExistente.id;
    } else {
      const { data: nuevaEspecialidad, error: crearError } =
        await Supabase.from('specialties')
          .insert({ name: dto.especialidad })
          .select('id')
          .single();

      if (crearError)
        return { exito: false, error: 'Error al crear especialidad.' };

      especialidadId = nuevaEspecialidad.id;
    }

    // Asignar especialidad al especialista
    const { error: asignarError } = await Supabase.from(
      'specialist_specialties',
    ).insert({
      profile_id: profileId,
      specialty_id: especialidadId,
    });

    if (asignarError)
      return {
        exito: false,
        error: 'Error al asignar especialidad al especialista.',
      };

    return { exito: true };
  }

  async login(email: string, password: string): Promise<AuthRespuesta> {
    // 1) Intento de login
    const { data: signInData, error: signInError } =
      await Supabase.auth.signInWithPassword({ email, password });

    // 2) Si hay error de credenciales o email no confirmado
    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes('must confirm') || msg.includes('confirm')) {
        return {
          exito: false,
          error: 'Debes verificar tu email antes de ingresar.',
        };
      }
      if (msg.includes('invalid login')) {
        return { exito: false, error: 'Email o contraseña incorrectos.' };
      }
      return { exito: false, error: signInError.message };
    }

    // 3) Refresco la info del usuario para obtener email_confirmed_at actualizado
    const {
      data: { user: refreshedUser },
      error: getUserError,
    } = await Supabase.auth.getUser();

    if (getUserError || !refreshedUser) {
      return {
        exito: false,
        error: 'No se pudo obtener la información del usuario.',
      };
    }

    // 4) Valido el flag de confirmación
    if (!refreshedUser.email_confirmed_at) {
      return {
        exito: false,
        error: 'Debes verificar tu email antes de ingresar.',
      };
    }

    // 5) Cargo el perfil de aplicación
    const { data: perfil, error: perfilError } = await Supabase.from('profiles')
      .select('*')
      .eq('user_id', refreshedUser.id)
      .single();

    if (perfilError) {
      return { exito: false, error: 'Perfil no encontrado.' };
    }

    // 6) Si es especialista, chequear validación admin
    if (perfil.role === 'especialista') {
      const { data: detalles, error: detallesError } = await Supabase.from(
        'specialist_details',
      )
        .select('admin_validated')
        .eq('profile_id', perfil.id)
        .single();

      if (detallesError || !detalles.admin_validated) {
        return {
          exito: false,
          error: 'Tu cuenta aún no fue validada por un administrador.',
        };
      }
    }

    // 7) Éxito: emito el perfil al BehaviorSubject
    this.userDataSubject.next(perfil);
    return { exito: true };
  }

  logout(): void {
    Supabase.auth.signOut();
    this.userDataSubject.next(null);
  }

  private async restoreSession(): Promise<void> {
    const {
      data: { session },
    } = await Supabase.auth.getSession();

    if (!session?.user) return;

    const { data: perfil } = await Supabase.from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    this.userDataSubject.next(perfil ?? null);
  }
}
