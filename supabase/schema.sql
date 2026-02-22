-- ═══════════════════════════════════════════════════════════
-- PLAN DE TRABAJO DOCENTE — Schema para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ═══════════════════════════════════════════════════════════

-- 1. TABLA: parametros (configuración global)
CREATE TABLE parametros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    horas_semestre INTEGER NOT NULL DEFAULT 1012,
    horas_nucleo INTEGER NOT NULL DEFAULT 607,
    factor_12m NUMERIC(4,2) NOT NULL DEFAULT 0.50,
    factor_24m NUMERIC(4,2) NOT NULL DEFAULT 0.25,
    max_cursos_profesor INTEGER NOT NULL DEFAULT 6,
    max_cursos_investigador INTEGER NOT NULL DEFAULT 1,
    semestre_activo TEXT NOT NULL DEFAULT '2026-I',
    institucion TEXT NOT NULL DEFAULT 'Universidad XYZ',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: profesores
CREATE TABLE profesores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_profesor TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    programa TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK (perfil IN ('Plan Profesor', 'Plan Investigador', 'Plan Administrativo')),
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: cursos
CREATE TABLE cursos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_curso TEXT UNIQUE NOT NULL,
    curso TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Docencia', 'Investigación', 'Dirección', 'Otras')),
    horas_semestrales INTEGER NOT NULL CHECK (horas_semestrales > 0),
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA: actividades
CREATE TABLE actividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_actividad TEXT UNIQUE NOT NULL,
    actividad TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Docencia', 'Investigación', 'Dirección', 'Otras')),
    horas_base INTEGER NOT NULL CHECK (horas_base > 0),
    admite_duracion TEXT NOT NULL DEFAULT 'No aplica' CHECK (admite_duracion IN ('No aplica', '12', '24')),
    estado TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA: asignaciones (transaccional principal)
CREATE TABLE asignaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
    semestre TEXT NOT NULL,
    tipo_origen TEXT NOT NULL CHECK (tipo_origen IN ('Curso', 'Actividad')),
    curso_id UUID REFERENCES cursos(id),
    actividad_id UUID REFERENCES actividades(id),
    duracion_meses TEXT NOT NULL DEFAULT 'No aplica' CHECK (duracion_meses IN ('No aplica', '12', '24')),
    horas_base NUMERIC(8,2) NOT NULL,
    factor_semestral NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    horas_efectivas NUMERIC(8,2) NOT NULL,
    categoria TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Evitar duplicados: mismo profesor + semestre + item
    UNIQUE(profesor_id, semestre, curso_id),
    UNIQUE(profesor_id, semestre, actividad_id)
);

-- Índices para rendimiento
CREATE INDEX idx_asignaciones_profesor ON asignaciones(profesor_id);
CREATE INDEX idx_asignaciones_semestre ON asignaciones(semestre);
CREATE INDEX idx_asignaciones_prof_sem ON asignaciones(profesor_id, semestre);
CREATE INDEX idx_profesores_estado ON profesores(estado);

-- ═══════════════════════════════════════════════════════════
-- VISTA: resumen por profesor-semestre (precalculada)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW vista_resumen AS
SELECT
    p.id AS profesor_id,
    p.id_profesor,
    p.nombre,
    p.programa,
    p.perfil,
    a.semestre,
    COALESCE(SUM(CASE WHEN a.categoria = 'Docencia' THEN a.horas_efectivas END), 0) AS docencia,
    COALESCE(SUM(CASE WHEN a.categoria = 'Investigación' THEN a.horas_efectivas END), 0) AS investigacion,
    COALESCE(SUM(CASE WHEN a.categoria = 'Dirección' THEN a.horas_efectivas END), 0) AS direccion,
    COALESCE(SUM(CASE WHEN a.categoria = 'Otras' THEN a.horas_efectivas END), 0) AS otras,
    COALESCE(SUM(a.horas_efectivas), 0) AS total_horas,
    COUNT(CASE WHEN a.tipo_origen = 'Curso' THEN 1 END) AS nro_cursos,
    CASE p.perfil
        WHEN 'Plan Profesor' THEN COALESCE(SUM(CASE WHEN a.categoria = 'Docencia' THEN a.horas_efectivas END), 0)
        WHEN 'Plan Investigador' THEN COALESCE(SUM(CASE WHEN a.categoria = 'Investigación' THEN a.horas_efectivas END), 0)
        WHEN 'Plan Administrativo' THEN COALESCE(SUM(CASE WHEN a.categoria = 'Dirección' THEN a.horas_efectivas END), 0)
    END AS nucleo
FROM profesores p
LEFT JOIN asignaciones a ON p.id = a.profesor_id
WHERE p.estado = 'Activo'
GROUP BY p.id, p.id_profesor, p.nombre, p.programa, p.perfil, a.semestre;

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (deshabilitado por ahora para simplificar)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (acceso total con anon key - ajustar después)
CREATE POLICY "Allow all on parametros" ON parametros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on profesores" ON profesores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cursos" ON cursos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on actividades" ON actividades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on asignaciones" ON asignaciones FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- DATOS SEMILLA
-- ═══════════════════════════════════════════════════════════

-- Parámetros
INSERT INTO parametros (horas_semestre, horas_nucleo, factor_12m, factor_24m, max_cursos_profesor, max_cursos_investigador, semestre_activo, institucion)
VALUES (1012, 607, 0.50, 0.25, 6, 1, '2026-I', 'Universidad XYZ');

-- Profesores
INSERT INTO profesores (id_profesor, nombre, programa, perfil, estado, email) VALUES
('P001', 'María García López', 'Ing. de Sistemas', 'Plan Profesor', 'Activo', 'mgarcia@unixyz.edu'),
('P002', 'Carlos Rodríguez M.', 'Administración', 'Plan Investigador', 'Activo', 'crodriguez@unixyz.edu'),
('P003', 'Ana Martínez P.', 'Derecho', 'Plan Administrativo', 'Activo', 'amartinez@unixyz.edu'),
('P004', 'José Hernández R.', 'Ing. Industrial', 'Plan Profesor', 'Activo', 'jhernandez@unixyz.edu'),
('P005', 'Laura Sánchez V.', 'Economía', 'Plan Investigador', 'Activo', 'lsanchez@unixyz.edu'),
('P006', 'Diego Morales F.', 'Medicina', 'Plan Profesor', 'Activo', 'dmorales@unixyz.edu'),
('P007', 'Camila Ruiz T.', 'Psicología', 'Plan Administrativo', 'Activo', 'cruiz@unixyz.edu'),
('P008', 'Andrés López G.', 'Arquitectura', 'Plan Profesor', 'Inactivo', 'alopez@unixyz.edu');

-- Cursos
INSERT INTO cursos (id_curso, curso, categoria, horas_semestrales) VALUES
('C001', 'Cálculo Diferencial', 'Docencia', 96),
('C002', 'Programación I', 'Docencia', 80),
('C003', 'Álgebra Lineal', 'Docencia', 64),
('C004', 'Estadística I', 'Docencia', 80),
('C005', 'Seminario de Investigación', 'Investigación', 48),
('C006', 'Taller de Grado', 'Docencia', 64),
('C007', 'Gestión de Proyectos', 'Dirección', 48),
('C008', 'Bases de Datos', 'Docencia', 80),
('C009', 'Física Mecánica', 'Docencia', 96),
('C010', 'Anatomía Humana', 'Docencia', 120),
('C011', 'Derecho Constitucional', 'Docencia', 80),
('C012', 'Macroeconomía', 'Docencia', 80),
('C013', 'Diseño Arquitectónico I', 'Docencia', 96),
('C014', 'Psicología General', 'Docencia', 64),
('C015', 'Metodología de Investigación', 'Investigación', 48);

-- Actividades
INSERT INTO actividades (id_actividad, actividad, categoria, horas_base, admite_duracion) VALUES
('A001', 'Proyecto de investigación aplicada', 'Investigación', 400, '12'),
('A002', 'Investigación básica interdisciplinaria', 'Investigación', 600, '24'),
('A003', 'Tutoría académica', 'Otras', 80, 'No aplica'),
('A004', 'Dirección de programa académico', 'Dirección', 300, 'No aplica'),
('A005', 'Comité curricular', 'Otras', 60, 'No aplica'),
('A006', 'Dirección de departamento', 'Dirección', 400, 'No aplica'),
('A007', 'Publicación en revista indexada', 'Investigación', 200, '12'),
('A008', 'Extensión y proyección social', 'Otras', 100, 'No aplica'),
('A009', 'Preparación de material didáctico', 'Docencia', 120, 'No aplica'),
('A010', 'Coordinación de laboratorio', 'Dirección', 150, 'No aplica'),
('A011', 'Dirección de tesis doctoral', 'Investigación', 180, '24'),
('A012', 'Pasantía internacional', 'Investigación', 300, '12'),
('A013', 'Capacitación docente', 'Otras', 40, 'No aplica'),
('A014', 'Representación institucional', 'Dirección', 100, 'No aplica'),
('A015', 'Evaluación y acreditación', 'Otras', 80, 'No aplica');

-- Asignaciones de prueba (semestre 2026-I)
DO $$
DECLARE
    p1 UUID; p2 UUID; p3 UUID; p4 UUID; p5 UUID; p6 UUID;
    c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID; c6 UUID; c8 UUID; c9 UUID; c10 UUID; c11 UUID; c12 UUID;
    a1 UUID; a2 UUID; a3 UUID; a4 UUID; a5 UUID; a6 UUID; a7 UUID; a9 UUID; a11 UUID; a12 UUID; a13 UUID;
BEGIN
    SELECT id INTO p1 FROM profesores WHERE id_profesor='P001';
    SELECT id INTO p2 FROM profesores WHERE id_profesor='P002';
    SELECT id INTO p3 FROM profesores WHERE id_profesor='P003';
    SELECT id INTO p4 FROM profesores WHERE id_profesor='P004';
    SELECT id INTO p5 FROM profesores WHERE id_profesor='P005';
    SELECT id INTO p6 FROM profesores WHERE id_profesor='P006';
    SELECT id INTO c1 FROM cursos WHERE id_curso='C001';
    SELECT id INTO c2 FROM cursos WHERE id_curso='C002';
    SELECT id INTO c3 FROM cursos WHERE id_curso='C003';
    SELECT id INTO c4 FROM cursos WHERE id_curso='C004';
    SELECT id INTO c5 FROM cursos WHERE id_curso='C005';
    SELECT id INTO c6 FROM cursos WHERE id_curso='C006';
    SELECT id INTO c8 FROM cursos WHERE id_curso='C008';
    SELECT id INTO c9 FROM cursos WHERE id_curso='C009';
    SELECT id INTO c10 FROM cursos WHERE id_curso='C010';
    SELECT id INTO c11 FROM cursos WHERE id_curso='C011';
    SELECT id INTO c12 FROM cursos WHERE id_curso='C012';
    SELECT id INTO a1 FROM actividades WHERE id_actividad='A001';
    SELECT id INTO a2 FROM actividades WHERE id_actividad='A002';
    SELECT id INTO a3 FROM actividades WHERE id_actividad='A003';
    SELECT id INTO a4 FROM actividades WHERE id_actividad='A004';
    SELECT id INTO a5 FROM actividades WHERE id_actividad='A005';
    SELECT id INTO a6 FROM actividades WHERE id_actividad='A006';
    SELECT id INTO a7 FROM actividades WHERE id_actividad='A007';
    SELECT id INTO a9 FROM actividades WHERE id_actividad='A009';
    SELECT id INTO a11 FROM actividades WHERE id_actividad='A011';
    SELECT id INTO a12 FROM actividades WHERE id_actividad='A012';
    SELECT id INTO a13 FROM actividades WHERE id_actividad='A013';

    -- P001 María (Profesor): 5 cursos + 3 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p1,'2026-I','Curso',c1,NULL,'No aplica',96,1,96,'Docencia'),
    (p1,'2026-I','Curso',c2,NULL,'No aplica',80,1,80,'Docencia'),
    (p1,'2026-I','Curso',c3,NULL,'No aplica',64,1,64,'Docencia'),
    (p1,'2026-I','Curso',c4,NULL,'No aplica',80,1,80,'Docencia'),
    (p1,'2026-I','Curso',c6,NULL,'No aplica',64,1,64,'Docencia'),
    (p1,'2026-I','Actividad',NULL,a3,'No aplica',80,1,80,'Otras'),
    (p1,'2026-I','Actividad',NULL,a9,'No aplica',120,1,120,'Docencia'),
    (p1,'2026-I','Actividad',NULL,a5,'No aplica',60,1,60,'Otras');

    -- P002 Carlos (Investigador): 1 curso + 4 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p2,'2026-I','Curso',c5,NULL,'No aplica',48,1,48,'Investigación'),
    (p2,'2026-I','Actividad',NULL,a2,'24',600,0.25,150,'Investigación'),
    (p2,'2026-I','Actividad',NULL,a7,'12',200,0.5,100,'Investigación'),
    (p2,'2026-I','Actividad',NULL,a3,'No aplica',80,1,80,'Otras'),
    (p2,'2026-I','Actividad',NULL,a11,'24',180,0.25,45,'Investigación');

    -- P003 Ana (Administrativo): 1 curso + 3 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p3,'2026-I','Actividad',NULL,a6,'No aplica',400,1,400,'Dirección'),
    (p3,'2026-I','Actividad',NULL,a4,'No aplica',300,1,300,'Dirección'),
    (p3,'2026-I','Curso',c11,NULL,'No aplica',80,1,80,'Docencia'),
    (p3,'2026-I','Actividad',NULL,a5,'No aplica',60,1,60,'Otras');

    -- P004 José (Profesor): 5 cursos + 3 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p4,'2026-I','Curso',c9,NULL,'No aplica',96,1,96,'Docencia'),
    (p4,'2026-I','Curso',c1,NULL,'No aplica',96,1,96,'Docencia'),
    (p4,'2026-I','Curso',c3,NULL,'No aplica',64,1,64,'Docencia'),
    (p4,'2026-I','Curso',c4,NULL,'No aplica',80,1,80,'Docencia'),
    (p4,'2026-I','Curso',c8,NULL,'No aplica',80,1,80,'Docencia'),
    (p4,'2026-I','Actividad',NULL,a3,'No aplica',80,1,80,'Otras'),
    (p4,'2026-I','Actividad',NULL,a9,'No aplica',120,1,120,'Docencia'),
    (p4,'2026-I','Actividad',NULL,a5,'No aplica',60,1,60,'Otras');

    -- P005 Laura (Investigador): 1 curso + 5 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p5,'2026-I','Curso',c12,NULL,'No aplica',80,1,80,'Docencia'),
    (p5,'2026-I','Actividad',NULL,a1,'12',400,0.5,200,'Investigación'),
    (p5,'2026-I','Actividad',NULL,a7,'12',200,0.5,100,'Investigación'),
    (p5,'2026-I','Actividad',NULL,a11,'24',180,0.25,45,'Investigación'),
    (p5,'2026-I','Actividad',NULL,a3,'No aplica',80,1,80,'Otras'),
    (p5,'2026-I','Actividad',NULL,a12,'12',300,0.5,150,'Investigación');

    -- P006 Diego (Profesor): 4 cursos + 4 actividades
    INSERT INTO asignaciones (profesor_id,semestre,tipo_origen,curso_id,actividad_id,duracion_meses,horas_base,factor_semestral,horas_efectivas,categoria) VALUES
    (p6,'2026-I','Curso',c10,NULL,'No aplica',120,1,120,'Docencia'),
    (p6,'2026-I','Curso',c1,NULL,'No aplica',96,1,96,'Docencia'),
    (p6,'2026-I','Curso',c2,NULL,'No aplica',80,1,80,'Docencia'),
    (p6,'2026-I','Curso',c4,NULL,'No aplica',80,1,80,'Docencia'),
    (p6,'2026-I','Actividad',NULL,a3,'No aplica',80,1,80,'Otras'),
    (p6,'2026-I','Actividad',NULL,a9,'No aplica',120,1,120,'Docencia'),
    (p6,'2026-I','Actividad',NULL,a5,'No aplica',60,1,60,'Otras'),
    (p6,'2026-I','Actividad',NULL,a13,'No aplica',40,1,40,'Otras');
END $$;
