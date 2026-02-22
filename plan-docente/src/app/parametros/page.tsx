"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Parametros } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import toast from "react-hot-toast";

const fields: [keyof Parametros, string, string][] = [
  ["horas_semestre", "Horas_Semestre", "Total horas requeridas por semestre"],
  ["horas_nucleo", "Horas_Nucleo", "Horas del núcleo principal del perfil"],
  ["factor_12m", "Factor_12m", "Factor semestral proyectos 12 meses"],
  ["factor_24m", "Factor_24m", "Factor semestral proyectos 24 meses"],
  ["max_cursos_profesor", "Max_Cursos_Profesor", "Máximo cursos para Plan Profesor"],
  ["max_cursos_investigador", "Max_Cursos_Investigador", "Máximo cursos para Plan Investigador"],
  ["semestre_activo", "Semestre_Activo", "Semestre en curso"],
  ["institucion", "Institucion", "Nombre de la institución"],
];

export default function ParametrosPage() {
  const [data, setData] = useState<Parametros | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("parametros").select("*").single().then(({ data: d }) => {
      if (d) { setData(d); setForm(d); }
    });
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase.from("parametros").update({
      horas_semestre: Number(form.horas_semestre),
      horas_nucleo: Number(form.horas_nucleo),
      factor_12m: Number(form.factor_12m),
      factor_24m: Number(form.factor_24m),
      max_cursos_profesor: Number(form.max_cursos_profesor),
      max_cursos_investigador: Number(form.max_cursos_investigador),
      semestre_activo: form.semestre_activo,
      institucion: form.institucion,
    }).eq("id", data.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configuración actualizada");
  };

  if (!data) return <div className="text-center text-gray-400 py-12">Cargando...</div>;

  return (
    <div>
      <PageHeader title="Parámetros" subtitle="Configuración del sistema" />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-2xl">
        {fields.map(([key, name, desc], i) => (
          <div key={key} className={`flex items-center px-5 py-3.5 gap-4 ${i < fields.length - 1 ? "border-b border-gray-100" : ""}`}>
            <div className="flex-1">
              <div className="font-semibold text-[13px]">{name}</div>
              <div className="text-[11px] text-gray-400">{desc}</div>
            </div>
            <input
              value={form[key] ?? ""}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="w-40 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-right font-semibold bg-gray-50"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end max-w-2xl">
        <button onClick={handleSave} disabled={saving}
          className="px-7 py-2.5 rounded-lg bg-[#2E75B6] text-white text-[13px] font-bold hover:bg-[#2563a0] disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
