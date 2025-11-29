import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Usuario } from "../models/Auth/Usuario";
import { Supabase } from "../supabase";
import { mapPerfilToUsuario } from "../mappers/mapPerfilToUsuario";
import { RegistroPaciente } from "../models/Auth/RegistroPaciente";
import { subirImagenDesdeBase64 } from "../helpers/upload-base64";
import { RespuestaApi } from "../models/RespuestaApi";
import { RegistroEspecialista } from "../models/Auth/RegistroEspecialista";
import { RegistroAdmin } from "../models/Auth/RegistroAdmin";
import { Especialidad } from "../models/SupaBase/Especialidad";

import { mapSupabaseError } from "../mappers/mapAuthError";
import { Captcha } from "../models/captcha";

@Injectable({
  providedIn: "root",
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

  async recargarUsuario(): Promise<void> {
    const current = this.getCurrentUser();
    if (!current) return;
    await this.loadUsuarioDesdePerfil(current.auth_id, current.email);
  }

  getAvatarUrl(path: string): string {
    return Supabase.storage.from("imagenes").getPublicUrl(path).data.publicUrl;
  }

  private async restoreUserFromSession(): Promise<void> {
    const { data, error } = await Supabase.auth.getUser();

    // Si el token quedó inválido, cerramos sesión y limpiamos
    if (error?.message === "User from sub claim in JWT does not exist") {
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

    await this.loadUsuarioDesdePerfil(data.user.id, data.user.email ?? "");
  }

  async loadUsuarioDesdePerfil(
    auth_id: string,
    email: string,
  ): Promise<RespuestaApi<void>> {
    if (!auth_id) {
      this.userSubject.next(null);
      return { success: false };
    }

    const { data: perfil, error } = await Supabase.from("perfiles")
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
          activo
        ),
        especialista_especialidades (
        duracion,
          especialidades (
            id,
            nombre,
            url_icono
          )
        )
      `,
      )
      .eq("auth_id", auth_id)
      .maybeSingle();

    if (error || !perfil) {
      this.userSubject.next(null);
      return { success: false };
    }

    const usuario = mapPerfilToUsuario(perfil, email);

    // Si es especialista pero no validado, no dejamos pasar
    if (usuario.rol === "especialista" && !usuario.validadoAdmin) {
      this.userSubject.next(null);
      return {
        success: false,
        errorCode: "Tu cuenta aún no fue validada por un administrador",
      };
    }

    if (!usuario.emailVerificado) {
      const { error: updateError } = await Supabase.from("perfiles")
        .update({ email_verificado: true })
        .eq("auth_id", auth_id);

      if (updateError) {
        console.error("Error al actualizar email_verificado:", updateError);
        return {
          success: false,
          errorCode:
            "No se pudo actualizar el estado de verificación del email",
        };
      }

      // Refrescás el usuario para tener la versión actualizada
      usuario.emailVerificado = true;
    }

    this.userSubject.next(usuario);
    return { success: true };
  }

  async login(email: string, password: string): Promise<RespuestaApi<void>> {
    const { data, error } = await Supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: error?.message ?? "Error desconocido al iniciar sesión",
      };
    }

    const respuesta = await this.loadUsuarioDesdePerfil(
      data.user.id,
      data.user.email ?? "",
    );

    if (respuesta.success == false) {
      return respuesta;
    }

    return { success: true };
  }

  async logout(): Promise<void> {
    await Supabase.auth.signOut();
    this.userSubject.next(null);
  }

  async registerPaciente(
    dataRegistro: RegistroPaciente,
  ): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data, error } = await Supabase.auth.signUp({
      email: dataRegistro.mail,
      password: dataRegistro.contrasena,
    });

    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: "Ya existe una cuenta registrada con este email.",
      };
    }

    if (error || !data.user) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: error?.message ?? "Error desconocido al registrar",
      };
    }

    const auth_id = data.user.id;
    const nombreSanitizado = dataRegistro.nombre.replace(/\s+/g, "");

    // Paso 2: Subir imágenes
    const imagenPerfilRes = await subirImagenDesdeBase64(
      dataRegistro.imagenPerfil,
      "fotoPerfilPaciente",
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    const imagenFondoRes = await subirImagenDesdeBase64(
      dataRegistro.imagenFondo,
      "fotoFondoPaciente",
      `fondo-${nombreSanitizado}`,
    );

    if (!imagenFondoRes.success || !imagenFondoRes.data) {
      return { success: false, message: imagenFondoRes.message };
    }

    // Paso 3: Insertar perfil y obtener el id generado
    const { data: perfilData, error: perfilError } = await Supabase.from(
      "perfiles",
    )
      .insert({
        auth_id,
        nombre: dataRegistro.nombre,
        apellido: dataRegistro.apellido,
        edad: parseInt(dataRegistro.edad, 10),
        dni: dataRegistro.dni,
        url_imagen_perfil: imagenPerfilRes.data,
        rol: "paciente",
      })
      .select("id")
      .single();

    if (perfilError || !perfilData) {
      return {
        success: false,
        message: "Error al guardar el perfil del usuario.",
      };
    }

    // Paso 4: Insertar detalles_paciente usando perfilData.id
    const { error: detallesError } = await Supabase.from(
      "detalles_paciente",
    ).insert({
      perfil_id: perfilData.id,
      obra_social: dataRegistro.obraSocial,
      url_imagen_fondo: imagenFondoRes.data,
    });

    if (detallesError) {
      return {
        success: false,
        message: "Error al guardar la obra social del paciente.",
      };
    }

    return { success: true };
  }

  async registerEspecialista(
    dataRegistro: RegistroEspecialista,
  ): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data, error } = await Supabase.auth.signUp({
      email: dataRegistro.mail,
      password: dataRegistro.contrasena,
    });

    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: "Ya existe una cuenta registrada con este email.",
      };
    }

    if (error || !data.user) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: error?.message ?? "Error desconocido al iniciar sesión",
      };
    }

    const auth_id = data.user.id;
    const nombreSanitizado = dataRegistro.nombre.replace(/\s+/g, "");

    // Paso 2: Subir imagen de perfil
    const imagenPerfilRes = await subirImagenDesdeBase64(
      dataRegistro.imagenPerfil,
      "fotoPerfilEspecialista",
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    // Paso 3: Insertar en perfiles y obtener el id generado
    const { data: perfilData, error: perfilError } = await Supabase.from(
      "perfiles",
    )
      .insert({
        auth_id,
        nombre: dataRegistro.nombre,
        apellido: dataRegistro.apellido,
        edad: parseInt(dataRegistro.edad, 10),
        dni: dataRegistro.dni,
        url_imagen_perfil: imagenPerfilRes.data,
        rol: "especialista",
      })
      .select("id")
      .single();

    if (perfilError || !perfilData) {
      return {
        success: false,
        message: "Error al guardar el perfil del especialista.",
      };
    }

    // Paso 4: Insertar en detalles_especialista usando perfilData.id
    const { error: detallesError } = await Supabase.from(
      "detalles_especialista",
    ).insert({
      perfil_id: perfilData.id,
      validado_admin: false,
      activo: true,
    });

    if (detallesError) {
      return {
        success: false,
        message: "Error al guardar los detalles del especialista.",
      };
    }

    // Paso 5: Insertar especialidades (múltiples)
    const especialidadesParaInsertar = [];

    for (const especialidad of dataRegistro.especialidades) {
      const parsedId = Number(especialidad);
      const esNueva = !Number.isInteger(parsedId);

      let especialidadId: number;

      if (esNueva) {
        // Es una nueva especialidad (texto)
        const resultado = await this.agregarEspecialidadSiNoExiste(
          String(especialidad),
        );

        if (!resultado.success || !resultado.data) {
          return { success: false, message: resultado.message };
        }

        especialidadId = resultado.data;
      } else {
        // Es un ID existente
        especialidadId = parsedId;
      }

      especialidadesParaInsertar.push({
        perfil_id: perfilData.id,
        especialidad_id: especialidadId,
        duracion: 30,
      });
    }

    // Insertar todas las especialidades
    if (especialidadesParaInsertar.length > 0) {
      const { error: especialidadError } = await Supabase.from(
        "especialista_especialidades",
      ).insert(especialidadesParaInsertar);

      if (especialidadError) {
        return {
          success: false,
          message: "Error al asignar las especialidades al especialista.",
        };
      }
    }

    return { success: true };
  }

  async registerAdmin(
    dataRegistro: RegistroAdmin,
  ): Promise<RespuestaApi<void>> {
    // Paso 1: Crear usuario en Auth
    const { data, error } = await Supabase.auth.signUp({
      email: dataRegistro.mail,
      password: dataRegistro.contrasena,
    });

    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: "Ya existe una cuenta registrada con este email.",
      };
    }

    if (error || !data.user) {
      return {
        success: false,
        errorCode: mapSupabaseError(error),
        message: error?.message ?? "Error desconocido al iniciar sesión",
      };
    }

    const auth_id = data.user.id;
    const nombreSanitizado = dataRegistro.nombre.replace(/\s+/g, "");

    // Paso 2: Subir imagen de perfil
    const imagenPerfilRes = await subirImagenDesdeBase64(
      dataRegistro.imagenPerfil,
      "fotoPerfilAdmin",
      `perfil-${nombreSanitizado}`,
    );

    if (!imagenPerfilRes.success || !imagenPerfilRes.data) {
      return { success: false, message: imagenPerfilRes.message };
    }

    // Paso 3: Insertar perfil y obtener el id generado
    const { error: perfilError } = await Supabase.from("perfiles").insert({
      auth_id,
      nombre: dataRegistro.nombre,
      apellido: dataRegistro.apellido,
      edad: parseInt(dataRegistro.edad, 10),
      dni: dataRegistro.dni,
      url_imagen_perfil: imagenPerfilRes.data,
      rol: "admin",
    });

    if (perfilError) {
      return {
        success: false,
        message: "Error al guardar el perfil del admin.",
      };
    }

    return { success: true };
  }

  async obtenerEspecialidades(): Promise<Especialidad[]> {
    const { data, error } = await Supabase.from("especialidades")
      .select("id, nombre, url_icono")
      .order("nombre", { ascending: true });

    if (error || !data) {
      console.error("Error al obtener especialidades:", error);
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
      "especialidades",
    )
      .select("id, nombre")
      .ilike("nombre", nombreNormalizado);

    if (errorConsulta) {
      return {
        success: false,
        message: "Error al buscar especialidades existentes",
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
      "https://rtcjwvxzoxhglvqirrel.supabase.co/storage/v1/object/public/imagenes/fotoEspecialidad/default.png";

    // Insertamos la nueva especialidad
    const { data: insertada, error: errorInsert } = await Supabase.from(
      "especialidades",
    )
      .insert({ nombre, url_icono: defaultUrl })
      .select("id")
      .single();

    if (errorInsert || !insertada?.id) {
      return {
        success: false,
        message: "Error al insertar nueva especialidad.",
      };
    }

    return { success: true, data: insertada.id };
  }

  async getCaptchas(): Promise<Captcha[]> {
    const { data, error } = await Supabase.from("captcha")
      .select("imagenUrl, respuesta")
      .overrideTypes<
        { imagenUrl: string; respuesta: string }[],
        { merge: false }
      >();

    if (error || !data) {
      console.error("Error al obtener captchas:", error);
      return [];
    }

    return data.map((item) => ({
      imagenUrl: item.imagenUrl,
      answerHash: item.respuesta,
    }));
  }

  async registrarIngreso(perfilId: number): Promise<void> {
    const { error } = await Supabase.from("registro_ingresos").insert({
      perfil_id: perfilId,
      // fecha_ingreso se setea solo si tiene default value `now()` en Supabase
    });

    if (error) {
      console.error("Error al registrar el ingreso:", error.message);
      // Podés manejarlo con tu sistema de errores si querés
    }
  }
}
