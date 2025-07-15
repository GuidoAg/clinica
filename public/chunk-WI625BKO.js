import{b as u}from"./chunk-E5ORBMNA.js";import{b as s}from"./chunk-ICAC2HSA.js";import{T as n,X as c}from"./chunk-PO4THZAS.js";import{j as l}from"./chunk-TWZW5B45.js";var m=class o{constructor(i){this.auth=i}obtenerTodosUsuarios(){return l(this,null,function*(){let{data:i,error:e}=yield s.from("vista_perfiles_con_email").select(`
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
    `);return e?(console.error("Error al obtener usuarios:",e),[]):i.map(a=>{let t=Array.isArray(a.detalles_paciente)?a.detalles_paciente[0]:a.detalles_paciente??null,d=Array.isArray(a.detalles_especialista)?a.detalles_especialista[0]:a.detalles_especialista??null,_=(a.especialista_especialidades??[]).map(r=>({id:r.especialidades.id,nombre:r.especialidades.nombre,urlIcono:r.especialidades.url_icono??void 0,duracion:r.duracion}));return{id:a.id,auth_id:a.auth_id,nombre:a.nombre,apellido:a.apellido,edad:String(a.edad),dni:a.dni,urlImagenPerfil:a.url_imagen_perfil,email:a.email??"",emailVerificado:a.email_verificado_real??!1,rol:a.rol,activo:d?.activo??!0,validadoAdmin:d?.validado_admin??!1,obraSocial:t?.obra_social,urlImagenFondo:t?.url_imagen_fondo,especialidades:_}})})}actualizarEstadoEspecialista(i,e){return l(this,null,function*(){let{error:a}=yield s.from("detalles_especialista").update({validado_admin:e}).eq("perfil_id",i);return a?(console.error("Error al actualizar validado_admin del especialista:",a),!1):!0})}static \u0275fac=function(e){return new(e||o)(c(u))};static \u0275prov=n({token:o,factory:o.\u0275fac,providedIn:"root"})};export{m as a};
