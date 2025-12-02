-- =====================================================================
-- ÍNDICES DE OPTIMIZACIÓN PARA CLÍNICA
-- =====================================================================
-- Ejecutar en el SQL Editor de Supabase
-- Estos índices optimizan las queries más frecuentes del sistema
-- Fecha: 2025-12-01
-- =====================================================================
-- INSTRUCCIONES:
-- 1. Ejecutar TODO el script de una vez, O
-- 2. Ejecutar sección por sección si hay algún error
-- 3. Los errores "relation already exists" son normales y se ignoran
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLA: citas
-- Queries optimizadas:
-- - Búsqueda por especialista/paciente
-- - Filtrado por fechas
-- - Filtrado por estado
-- - Combinaciones de fecha + especialista/paciente
-- ---------------------------------------------------------------------

-- Índice simple para especialista_id
CREATE INDEX IF NOT EXISTS idx_citas_especialista 
ON public.citas(especialista_id);

-- Índice simple para paciente_id
CREATE INDEX IF NOT EXISTS idx_citas_paciente 
ON public.citas(paciente_id);

-- Índice simple para fecha_hora
CREATE INDEX IF NOT EXISTS idx_citas_fecha 
ON public.citas(fecha_hora);

-- Índice simple para estado
CREATE INDEX IF NOT EXISTS idx_citas_estado 
ON public.citas(estado);

-- Índice compuesto para queries de disponibilidad
-- Optimiza: obtenerCitasEspecialista(), obtenerCitasCombinadasDia()
CREATE INDEX IF NOT EXISTS idx_citas_fecha_especialista 
ON public.citas(fecha_hora, especialista_id);

-- Índice compuesto para queries de paciente
-- Optimiza: obtenerCitasPaciente(), validaciones de solapamiento
CREATE INDEX IF NOT EXISTS idx_citas_fecha_paciente 
ON public.citas(fecha_hora, paciente_id);

-- Índice compuesto para filtrado por estado y especialista
-- Optimiza: estadísticas, filtros combinados
CREATE INDEX IF NOT EXISTS idx_citas_estado_especialista 
ON public.citas(estado, especialista_id);

-- Índice compuesto para filtrado por estado y fecha
-- Optimiza: obtención de citas futuras/pasadas por estado
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha 
ON public.citas(estado, fecha_hora);


-- ---------------------------------------------------------------------
-- TABLA: disponibilidades
-- Queries optimizadas:
-- - Búsqueda por perfil_id
-- - Filtrado por día de la semana
-- - Filtrado por habilitado
-- ---------------------------------------------------------------------

-- Índice simple para perfil_id
CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil 
ON public.disponibilidades(perfil_id);

-- Índice compuesto para día de la semana específico
-- Optimiza: obtenerDisponibilidadDia()
CREATE INDEX IF NOT EXISTS idx_disponibilidades_perfil_dia 
ON public.disponibilidades(perfil_id, dia_semana);

-- Índice compuesto para disponibilidades habilitadas
-- Optimiza: obtenerDiasEspecialista(), tieneDisponibilidadConfigurada()
CREATE INDEX IF NOT EXISTS idx_disponibilidades_habilitado 
ON public.disponibilidades(perfil_id, habilitado);


-- ---------------------------------------------------------------------
-- TABLA: datos_medicos_dinamicos
-- Queries optimizadas:
-- - Búsqueda por cita_id
-- ---------------------------------------------------------------------

-- Índice para cita_id
-- Optimiza: mapearCitasCompletas(), obtenerDatosMedicosExtrasCita()
CREATE INDEX IF NOT EXISTS idx_datos_medicos_cita 
ON public.datos_medicos_dinamicos(cita_id);


-- ---------------------------------------------------------------------
-- TABLA: registro_ingresos
-- Queries optimizadas:
-- - Búsqueda por fecha
-- - Filtrado por perfil_id
-- - Ordenamiento temporal
-- ---------------------------------------------------------------------

-- Índice para fecha_ingreso
-- Optimiza: obtenerLogIngresos(), obtenerIngresosPorRol()
CREATE INDEX IF NOT EXISTS idx_registro_ingresos_fecha 
ON public.registro_ingresos(fecha_ingreso);

-- Índice para perfil_id
-- Optimiza: joins con perfiles
CREATE INDEX IF NOT EXISTS idx_registro_ingresos_perfil 
ON public.registro_ingresos(perfil_id);

-- Índice compuesto para queries de tendencias
-- Optimiza: obtenerIngresosPorRol() con filtros temporales
CREATE INDEX IF NOT EXISTS idx_registro_ingresos_fecha_perfil 
ON public.registro_ingresos(fecha_ingreso, perfil_id);


-- ---------------------------------------------------------------------
-- TABLA: especialista_especialidades
-- Queries optimizadas:
-- - Búsqueda por perfil_id (especialista)
-- - Búsqueda por especialidad_id
-- ---------------------------------------------------------------------

-- Índice para perfil_id (especialista)
CREATE INDEX IF NOT EXISTS idx_especialista_especialidades_perfil 
ON public.especialista_especialidades(perfil_id);

-- Índice para especialidad_id
CREATE INDEX IF NOT EXISTS idx_especialista_especialidades_especialidad 
ON public.especialista_especialidades(especialidad_id);


-- ---------------------------------------------------------------------
-- TABLA: registros_medicos
-- Queries optimizadas:
-- - Búsqueda por cita_id
-- ---------------------------------------------------------------------

-- Índice para cita_id
CREATE INDEX IF NOT EXISTS idx_registros_medicos_cita 
ON public.registros_medicos(cita_id);


-- ---------------------------------------------------------------------
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ---------------------------------------------------------------------

-- Ejecutar esta query para verificar los índices de la tabla citas:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'citas' 
-- ORDER BY indexname;

-- Ejecutar esta query para verificar los índices de la tabla disponibilidades:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'disponibilidades' 
-- ORDER BY indexname;


-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================
-- 
-- 1. Estos índices mejoran significativamente el rendimiento de las
--    queries más frecuentes del sistema.
--
-- 2. Los índices compuestos están ordenados según el patrón de uso
--    más común (ej: fecha antes que id para rangos temporales).
--
-- 3. IF NOT EXISTS previene errores si el índice ya existe.
--
-- 4. El impacto en espacio de disco es mínimo comparado con la
--    mejora en velocidad de queries.
--
-- 5. Los índices se mantienen automáticamente por PostgreSQL.
--
-- 6. Para bases de datos muy grandes (>100k registros), considerar
--    también el uso de particionamiento por fecha en la tabla citas.
--
-- =====================================================================
