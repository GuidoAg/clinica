import{b as m}from"./chunk-OJPJNVHA.js";import{b as d}from"./chunk-PAEHXDDS.js";import{T as c,Y as u}from"./chunk-ZQYZ5UVW.js";import{i as s}from"./chunk-ODN5LVDJ.js";var _=class l{auth=u(m);obtenerTodosUsuarios(){return s(this,null,function*(){let{data:i,error:e}=yield d.from("vista_perfiles_con_email").select(`
      id,
      auth_id,
      nombre,
      apellido,
      edad,
      dni,
      url_imagen_perfil, 
      rol,
      email,
      email_verificado_real,
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
    `);return e?(console.error("Error al obtener usuarios:",e),[]):i.map(a=>{let t=Array.isArray(a.detalles_paciente)?a.detalles_paciente[0]:a.detalles_paciente??null,n=Array.isArray(a.detalles_especialista)?a.detalles_especialista[0]:a.detalles_especialista??null,f=(a.especialista_especialidades??[]).map(r=>{let o=Array.isArray(r.especialidades)?r.especialidades[0]:r.especialidades;return{id:o?.id??0,nombre:o?.nombre??"",urlIcono:o?.url_icono??void 0,duracion:r.duracion}});return{id:a.id,auth_id:a.auth_id,nombre:a.nombre,apellido:a.apellido,edad:String(a.edad),dni:a.dni,urlImagenPerfil:a.url_imagen_perfil,email:a.email??"",emailVerificado:a.email_verificado_real??!1,rol:a.rol,activo:n?.activo??!0,validadoAdmin:n?.validado_admin??!1,obraSocial:t?.obra_social,urlImagenFondo:t?.url_imagen_fondo,especialidades:f}})})}actualizarEstadoEspecialista(i,e){return s(this,null,function*(){let{error:a}=yield d.from("detalles_especialista").update({validado_admin:e}).eq("perfil_id",i);return a?(console.error("Error al actualizar validado_admin del especialista:",a),!1):!0})}static \u0275fac=function(e){return new(e||l)};static \u0275prov=c({token:l,factory:l.\u0275fac,providedIn:"root"})};export{_ as a};
