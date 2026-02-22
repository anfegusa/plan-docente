export interface Profesor {
  id: string;
  id_profesor: string;
  nombre: string;
  programa: string;
  perfil: "Plan Profesor" | "Plan Investigador" | "Plan Administrativo";
  estado: "Activo" | "Inactivo";
  email?: string;
}

export interface Curso {
  id: string;
  id_curso: string;
  curso: string;
  categoria: string;
  horas_semestrales: number;
  estado: string;
}

export interface Actividad {
  id: string;
  id_actividad: string;
  actividad: string;
  categoria: string;
  horas_base: number;
  admite_duracion: string;
  estado: string;
}

export interface Asignacion {
  id: string;
  profesor_id: string;
  semestre: string;
  tipo_origen: "Curso" | "Actividad";
  curso_id?: string;
  actividad_id?: string;
  duracion_meses: string;
  horas_base: number;
  factor_semestral: number;
  horas_efectivas: number;
  categoria: string;
  // Joined
  profesores?: Profesor;
  cursos?: Curso;
  actividades?: Actividad;
}

export interface Parametros {
  id: string;
  horas_semestre: number;
  horas_nucleo: number;
  factor_12m: number;
  factor_24m: number;
  max_cursos_profesor: number;
  max_cursos_investigador: number;
  semestre_activo: string;
  institucion: string;
}

export interface Resumen {
  profesor_id: string;
  id_profesor: string;
  nombre: string;
  programa: string;
  perfil: string;
  semestre: string;
  docencia: number;
  investigacion: number;
  direccion: number;
  otras: number;
  total_horas: number;
  nro_cursos: number;
  nucleo: number;
}

export const SEMESTRES = [
  "2026-I","2026-II","2027-I","2027-II","2028-I","2028-II","2029-I","2029-II","2030-I","2030-II"
];

export const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Docencia:       { bg: "bg-blue-100", text: "text-blue-700" },
  Investigación:  { bg: "bg-purple-100", text: "text-purple-700" },
  Dirección:      { bg: "bg-orange-100", text: "text-orange-700" },
  Otras:          { bg: "bg-gray-100", text: "text-gray-600" },
};

export const PERFIL_COLORS: Record<string, { bg: string; text: string }> = {
  "Plan Profesor":       { bg: "bg-blue-100", text: "text-blue-700" },
  "Plan Investigador":   { bg: "bg-purple-100", text: "text-purple-700" },
  "Plan Administrativo": { bg: "bg-orange-100", text: "text-orange-700" },
};
