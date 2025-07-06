import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Usuario } from '../models/Auth/Usuario';
import { Supabase } from '../supabase';
import { mapPerfilToUsuario } from '../mappers/mapPerfilToUsuario';
import { RegistroPaciente } from '../models/Auth/RegistroPaciente';
import { subirImagenDesdeBase64 } from '../helpers/upload-base64';
import { RespuestaApi } from '../models/RespuestaApi';
import { RegistroEspecialista } from '../models/Auth/RegistroEspecialista';
import { RegistroAdmin } from '../models/Auth/RegistroAdmin';
import { Especialidad } from '../models/SupaBase/Especialidad';

@Injectable({
  providedIn: 'root',
})
export class AuthSupabase {
  private userSubject = new BehaviorSubject<Usuario | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.restoreUserFromSession();
  }

  getCurrentUser(): Usuario | null {
    return this.userSubject.getValue();
  }

  setCurrentUser(usuario: Usuario): void {
    this.userSubject.next(usuario);
  }

  updateCurrentUser(patch: Partial<Usuario>): void {
    const actual = this.getCurrentUser();
    if (actual) {
      this.userSubject.next({ ...actual, ...patch });
    }
  }

  getAvatarUrl(path: string): string {
    return Supabase.storage.from('imagenes').getPublicUrl(path).data.publicUrl;
  }

  private async restoreUserFromSession(): Promise<void> {
    const { data, error } = await Supabase.auth.getUser();

    // Si el token quedó inválido, cerramos sesión y limpiamos
    if (error?.message === 'User from sub claim in JWT does not exist') {
      await Supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      this.userSubject.next(null);
      return;
    }

    if (!data.user || !data.user.id) {
      this.userSubject.next(null);
      return;
    }

    await this.loadUsuarioDesdePerfil(data.user.id, data.user.email ?? '');
  }

  private async loadUsuarioDesdePerfil(
    auth_id: string,
    email: string,
  ): Promise<void> {
    if (!auth_id) {
      this.userSubject.next(null);
      return;
    }

    const { data: perfil, error: perfilError } = await Supabase.from('perfiles')
      .select(
        `
    id,
    auth_id,
    nombre,
    apellido,
    edad,
    dni,
    url_imagen_perfil,
    email_verificado,
    rol,
    detalles_paciente (
      obra_social,
      url_imagen_fondo
    ),
    detalles_especialista (
      validado_admin,
      activo,
      especialista_especialidades (
        especialidades (
          id,
          nombre,
          url_icono
        )
      )
    )
  `,
      )
      .eq('auth_id', auth_id)
      .maybeSingle();

    if (perfilError) {
      this.userSubject.next(null);
      return;
    }

    if (!perfil) {
      this.userSubject.next(null);
      return;
    }

    const usuario: Usuario = mapPerfilToUsuario(perfil, email);
    this.setCurrentUser(usuario);
  }

  async login(email: string, password: string): Promise<RespuestaApi<void>> {
    const { data, error } = await Supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message ?? 'Error desconocido al iniciar sesión',
      };
    }

    await this.loadUsuarioDesdePerfil(data.user.id, data.user.email ?? '');
    return { success: true };
  }

  async logout(): Promise<void> {
    await Supabase.auth.signOut();
    this.userSubject.next(null);
  }

  async registerPaciente(data: RegistroPaciente): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data: authData, error: authError } = await Supabase.auth.signUp({
      email: data.mail,
      password: data.contrasena,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message:
          authError?.message === 'User already registered'
            ? 'El correo ya está registrado.'
            : 'No se pudo crear el usuario. Intentalo de nuevo.',
      };
    }

    const auth_id = authData.user.id;
    const nombreSanitizado = data.nombre.replace(/\s+/g, '');

    // Paso 2: Subir imágenes
    const imagenPerfilRes = await subirImagenDesdeBase64(
      data.imagenPerfil,
      'fotoPerfilPaciente',
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    const imagenFondoRes = await subirImagenDesdeBase64(
      data.imagenFondo,
      'fotoFondoPaciente',
      `fondo-${nombreSanitizado}`,
    );

    if (!imagenFondoRes.success || !imagenFondoRes.data) {
      return { success: false, message: imagenFondoRes.message };
    }

    // Paso 3: Insertar perfil y obtener el id generado
    const { data: perfilData, error: perfilError } = await Supabase.from(
      'perfiles',
    )
      .insert({
        auth_id,
        nombre: data.nombre,
        apellido: data.apellido,
        edad: parseInt(data.edad, 10),
        dni: data.dni,
        url_imagen_perfil: imagenPerfilRes.data,
        rol: 'paciente',
      })
      .select('id')
      .single();

    if (perfilError || !perfilData) {
      return {
        success: false,
        message: 'Error al guardar el perfil del usuario.',
      };
    }

    // Paso 4: Insertar detalles_paciente usando perfilData.id
    const { error: detallesError } = await Supabase.from(
      'detalles_paciente',
    ).insert({
      perfil_id: perfilData.id,
      obra_social: data.obraSocial,
      url_imagen_fondo: imagenFondoRes.data,
    });

    if (detallesError) {
      return {
        success: false,
        message: 'Error al guardar la obra social del paciente.',
      };
    }

    return { success: true };
  }

  async registerEspecialista(
    data: RegistroEspecialista,
  ): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data: authData, error: authError } = await Supabase.auth.signUp({
      email: data.mail,
      password: data.contrasena,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message:
          authError?.message === 'User already registered'
            ? 'El correo ya está registrado.'
            : 'No se pudo crear el usuario. Intentalo de nuevo.',
      };
    }

    const auth_id = authData.user.id;
    const nombreSanitizado = data.nombre.replace(/\s+/g, '');

    // Paso 2: Subir imagen de perfil
    const imagenPerfilRes = await subirImagenDesdeBase64(
      data.imagenPerfil,
      'fotoPerfilEspecialista',
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    // Paso 3: Insertar en perfiles y obtener el id generado
    const { data: perfilData, error: perfilError } = await Supabase.from(
      'perfiles',
    )
      .insert({
        auth_id,
        nombre: data.nombre,
        apellido: data.apellido,
        edad: parseInt(data.edad, 10),
        dni: data.dni,
        url_imagen_perfil: imagenPerfilRes.data,
        rol: 'especialista',
      })
      .select('id')
      .single();

    if (perfilError || !perfilData) {
      return {
        success: false,
        message: 'Error al guardar el perfil del especialista.',
      };
    }

    // Paso 4: Insertar en detalles_especialista usando perfilData.id
    const { error: detallesError } = await Supabase.from(
      'detalles_especialista',
    ).insert({
      perfil_id: perfilData.id,
      validado_admin: false,
      activo: true,
    });

    if (detallesError) {
      return {
        success: false,
        message: 'Error al guardar los detalles del especialista.',
      };
    }

    // Paso 5: Insertar especialidad
    const parsedId = Number(data.especialidad);
    const esNueva = !Number.isInteger(parsedId);

    let especialidadId: number;

    if (esNueva) {
      const resultado = await this.agregarEspecialidadSiNoExiste(
        String(data.especialidad),
      );

      if (!resultado.success || !resultado.data) {
        return { success: false, message: resultado.message };
      }

      especialidadId = resultado.data;
    } else {
      especialidadId = parsedId;
    }

    const { error: especialidadError } = await Supabase.from(
      'especialista_especialidades',
    ).insert({
      perfil_id: perfilData.id,
      especialidad_id: especialidadId,
    });

    if (especialidadError) {
      return {
        success: false,
        message: 'Error al asignar la especialidad al especialista.',
      };
    }

    return { success: true };
  }

  async registerAdmin(data: RegistroAdmin): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data: authData, error: authError } = await Supabase.auth.signUp({
      email: data.mail,
      password: data.contrasena,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message:
          authError?.message === 'User already registered'
            ? 'El correo ya está registrado.'
            : 'No se pudo crear el usuario. Intentalo de nuevo.',
      };
    }

    const auth_id = authData.user.id;
    const nombreSanitizado = data.nombre.replace(/\s+/g, '');

    // Paso 2: Subir imagen de perfil
    const imagenPerfilRes = await subirImagenDesdeBase64(
      data.imagenPerfil,
      'fotoPerfilAdmin',
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    // Paso 3: Insertar perfil y obtener el id generado
    const { error: perfilError } = await Supabase.from('perfiles').insert({
      auth_id,
      nombre: data.nombre,
      apellido: data.apellido,
      edad: parseInt(data.edad, 10),
      dni: data.dni,
      url_imagen_perfil: imagenPerfilRes.data,
      rol: 'admin',
    });

    if (perfilError) {
      return {
        success: false,
        message: 'Error al guardar el perfil del admin.',
      };
    }

    return { success: true };
  }

  async obtenerEspecialidades(): Promise<Especialidad[]> {
    const { data, error } = await Supabase.from('especialidades')
      .select('id, nombre, url_icono')
      .order('nombre', { ascending: true });

    if (error || !data) {
      console.error('Error al obtener especialidades:', error);
      return [];
    }

    return data.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      urlIcono: e.url_icono ?? undefined,
    }));
  }

  async agregarEspecialidadSiNoExiste(
    nombre: string,
  ): Promise<RespuestaApi<number>> {
    const nombreNormalizado = nombre.trim().toLowerCase();

    // Verificamos si ya existe (case-insensitive)
    const { data: existentes, error: errorConsulta } = await Supabase.from(
      'especialidades',
    )
      .select('id, nombre')
      .ilike('nombre', nombreNormalizado);

    if (errorConsulta) {
      return {
        success: false,
        message: 'Error al buscar especialidades existentes',
      };
    }

    const yaExiste = existentes?.some(
      (e) => e.nombre.trim().toLowerCase() === nombreNormalizado,
    );

    if (yaExiste && existentes?.[0]?.id) {
      return { success: true, data: existentes[0].id }; // Reutilizamos la existente
    }

    // Insertamos la nueva especialidad con URL default
    const defaultUrl =
      'https://rtcjwvxzoxhglvqirrel.supabase.co/storage/v1/object/public/imagenes/fotoEspecialidad/default.png';

    // Insertamos la nueva especialidad
    const { data: insertada, error: errorInsert } = await Supabase.from(
      'especialidades',
    )
      .insert({ nombre, url_icono: defaultUrl })
      .select('id')
      .single();

    if (errorInsert || !insertada?.id) {
      return {
        success: false,
        message: 'Error al insertar nueva especialidad.',
      };
    }

    return { success: true, data: insertada.id };
  }
}

// async register(
//   nombre: string,
//   email: string,
//   password: string,
// ): Promise<{ exito: boolean; error?: string }> {
//   const { data: signUpData, error: signUpError } = await Supabase.auth.signUp(
//     { email, password },
//   );

//   if (signUpError || !signUpData.user) {
//     const yaRegistrado = signUpData.user?.identities?.length === 0;
//     return {
//       exito: false,
//       error: yaRegistrado
//         ? 'Este correo ya está registrado.'
//         : signUpError?.message || 'No se pudo registrar el usuario.',
//     };
//   }

//   const userId = signUpData.user.id;

//   // Subir avatar
//   const uniqueName = `${userId}_${Date.now()}_${avatar.name}`;
//   const avatarPath = `avatarUsuarios/${uniqueName}`;
//   const { error: uploadError } = await Supabase.storage
//     .from('imagenes')
//     .upload(avatarPath, avatar, { upsert: false });

//   if (uploadError) {
//     return { exito: false, error: 'Error al subir avatar.' };
//   }

//   // Insertar usuario en tabla "Usuarios"
//   const { data: insertedUser, error: insertError } = await Supabase.from(
//     'usuarios',
//   )
//     .insert([
//       {
//         idAuth: userId,
//         nombre: nombre,
//         valido: false,
//       },
//     ])
//     .select()
//     .single();

//   if (insertError) {
//     return { exito: false, error: 'Error al guardar datos del usuario.' };
//   }

//   return { exito: true };
// }

// async login(
//   email: string,
//   password: string,
// ): Promise<{ exito: boolean; error?: string }> {
//   const { data, error } = await Supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) {
//     const msg = error.message.toLowerCase();
//     if (msg.includes('confirm')) {
//       return {
//         exito: false,
//         error: 'Debes confirmar tu email antes de ingresar.',
//       };
//     }
//     return { exito: false, error: 'Email o contraseña incorrectos.' };
//   }

//   const {
//     data: { user },
//     error: userError,
//   } = await Supabase.auth.getUser();

//   if (userError || !user) {
//     return { exito: false, error: 'No se pudo obtener el usuario.' };
//   }

//   if (!user.email_confirmed_at) {
//     return {
//       exito: false,
//       error: 'Debes confirmar tu email antes de ingresar.',
//     };
//   }

//   await this.loadUserData(user.id);
//   return { exito: true };
// }

// async logout(): Promise<void> {
//   await Supabase.auth.signOut();
//   this.userSubject.next(null);
// }

// private userSubject = new BehaviorSubject<UsuarioBase | null>(null);
// userData$ = this.userSubject.asObservable();

// constructor() {
//   this.restoreSession();
// }

// async registrarPaciente(dto: RegistroPaciente): Promise<AuthRespuesta> {
//   const { data, error } = await Supabase.auth.signUp({
//     email: dto.mail,
//     password: dto.contrasena,
//   });

//   if (data.user?.identities?.length === 0) {
//     return {
//       exito: false,
//       error: 'Este correo ya está registrado. Por favor, usa otro.',
//     };
//   }

//   if (error || !data.user) {
//     return {
//       exito: false,
//       error: error?.message || 'No se pudo registrar el usuario.',
//     };
//   }

//   const userId = data.user?.id;
//   const { data: perfil, error: perfilError } = await Supabase.from('profiles')
//     .insert({
//       user_id: userId,
//       role: 'paciente',
//       first_name: dto.nombre,
//       last_name: dto.apellido,
//       age: Number(dto.edad),
//       dni: dto.dni,
//       email_verified: false,
//       profile_image_url: dto.imagenPerfil,
//     })
//     .select('id')
//     .single();

//   if (perfilError) {
//     if (perfilError.message.toLowerCase().includes('duplicate key value')) {
//       return {
//         exito: false,
//         error: 'Error, el mail ya fue utilizado pero en espera de validacion',
//       };
//     } else {
//       return {
//         exito: false,
//         error: 'Error al guardar perfil del especialista.',
//       };
//     }
//   }

//   const { error: detallesError } = await Supabase.from(
//     'patient_details',
//   ).insert({
//     profile_id: perfil.id,
//     obra_social: dto.obraSocial,
//   });

//   if (detallesError)
//     return { exito: false, error: 'Error al guardar datos del paciente.' };

//   return { exito: true };
// }

// async registrarEspecialista(
//   dto: RegistroEspecialista,
// ): Promise<AuthRespuesta> {
//   const { data, error } = await Supabase.auth.signUp({
//     email: dto.mail,
//     password: dto.contrasena,
//   });

//   if (error) return { exito: false, error: error.message };
//   if (data.user?.identities?.length === 0) {
//     return {
//       exito: false,
//       error: 'Este correo ya está registrado. Por favor, usa otro.',
//     };
//   }

//   const userId = data.user?.id;

//   // Insert perfil
//   const { data: perfil, error: perfilError } = await Supabase.from('profiles')
//     .insert({
//       user_id: userId,
//       role: 'especialista',
//       first_name: dto.nombre,
//       last_name: dto.apellido,
//       age: Number(dto.edad),
//       dni: dto.dni,
//       email_verified: false,
//       profile_image_url: dto.imagenPerfil,
//     })
//     .select('id')
//     .single();

//   if (perfilError) {
//     if (perfilError.message.toLowerCase().includes('duplicate key value')) {
//       return {
//         exito: false,
//         error: 'Error, el mail ya fue utilizado pero en espera de validacion',
//       };
//     } else {
//       return {
//         exito: false,
//         error: 'Error al guardar perfil del especialista.',
//       };
//     }
//   }

//   const profileId = perfil.id;

//   // Insert detalles
//   const { error: detallesError } = await Supabase.from(
//     'specialist_details',
//   ).insert({ profile_id: profileId });

//   if (detallesError)
//     return {
//       exito: false,
//       error: 'Error al guardar detalles del especialista.',
//     };

//   // Buscar o crear especialidad
//   const especialidadNombre = dto.especialidad.trim().toLowerCase();

//   const { data: especialidadExistente, error: buscarError } =
//     await Supabase.from('specialties')
//       .select('id, name')
//       .filter('name', 'ilike', especialidadNombre)
//       .maybeSingle();

//   let especialidadId: number | null = null;

//   if (buscarError) {
//     return { exito: false, error: 'Error al buscar especialidad.' };
//   }

//   if (especialidadExistente) {
//     especialidadId = especialidadExistente.id;
//   } else {
//     const { data: nuevaEspecialidad, error: crearError } =
//       await Supabase.from('specialties')
//         .insert({ name: dto.especialidad })
//         .select('id')
//         .single();

//     if (crearError)
//       return { exito: false, error: 'Error al crear especialidad.' };

//     especialidadId = nuevaEspecialidad.id;
//   }

//   // Asignar especialidad al especialista
//   const { error: asignarError } = await Supabase.from(
//     'specialist_specialties',
//   ).insert({
//     profile_id: profileId,
//     specialty_id: especialidadId,
//   });

//   if (asignarError)
//     return {
//       exito: false,
//       error: 'Error al asignar especialidad al especialista.',
//     };

//   return { exito: true };
// }

// async login(email: string, password: string): Promise<AuthRespuesta> {
//   // 1) Intento de login
//   const { data: signInData, error: signInError } =
//     await Supabase.auth.signInWithPassword({ email, password });

//   // 2) Si hay error de credenciales o email no confirmado
//   if (signInError) {
//     const msg = signInError.message.toLowerCase();
//     if (msg.includes('must confirm') || msg.includes('confirm')) {
//       return {
//         exito: false,
//         error: 'Debes verificar tu email antes de ingresar.',
//       };
//     }
//     if (msg.includes('invalid login')) {
//       return { exito: false, error: 'Email o contraseña incorrectos.' };
//     }
//     return { exito: false, error: signInError.message };
//   }

//   // 3) Refresco la info del usuario para obtener email_confirmed_at actualizado
//   const {
//     data: { user: refreshedUser },
//     error: getUserError,
//   } = await Supabase.auth.getUser();

//   if (getUserError || !refreshedUser) {
//     return {
//       exito: false,
//       error: 'No se pudo obtener la información del usuario.',
//     };
//   }

//   // 4) Valido el flag de confirmación
//   if (!refreshedUser.email_confirmed_at) {
//     return {
//       exito: false,
//       error: 'Debes verificar tu email antes de ingresar.',
//     };
//   }

//   // 5) Cargo el perfil de aplicación
//   const { data: perfil, error: perfilError } = await Supabase.from('profiles')
//     .select('*')
//     .eq('user_id', refreshedUser.id)
//     .single();

//   if (perfilError) {
//     return { exito: false, error: 'Perfil no encontrado.' };
//   }

//   // 6) Si es especialista, chequear validación admin
//   if (perfil.role === 'especialista') {
//     const { data: detalles, error: detallesError } = await Supabase.from(
//       'specialist_details',
//     )
//       .select('admin_validated')
//       .eq('profile_id', perfil.id)
//       .single();

//     if (detallesError || !detalles.admin_validated) {
//       return {
//         exito: false,
//         error: 'Tu cuenta aún no fue validada por un administrador.',
//       };
//     }
//   }

//   // 7) Éxito: emito el perfil al BehaviorSubject
//   this.userSubject.next(perfil);
//   return { exito: true };
// }

// logout(): void {
//   Supabase.auth.signOut();
//   this.userSubject.next(null);
// }

// private async restoreSession(): Promise<void> {
//   const {
//     data: { session },
//   } = await Supabase.auth.getSession();

//   if (!session?.user) return;

//   const { data: perfil } = await Supabase.from('profiles')
//     .select('*')
//     .eq('user_id', session.user.id)
//     .single();

//   this.userSubject.next(perfil ?? null);
// }
