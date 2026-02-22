"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profesor, Asignacion, Parametros, SEMESTRES } from "@/lib/types";
import { Badge, CatBadge } from "@/components/ui";

export default function MiPlan() {
  const [params, setParams] = useState<Parametros | null>(null);
  const [profes, setProfes] = useState<Profesor[]>([]);
  const [selProf, setSelProf] = useState("");
  const [sem, setSem] = useState("2026-I");
  const [asigs, setAsigs] = useState<Asignacion[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      supabase.from("parametros").select("*").single(),
      supabase.from("profesores").select("*").eq("estado", "Activo").order("nombre"),
    ]).then(([p, pr]) => {
      if (p.data) setParams(p.data);
      if (pr.data) { setProfes(pr.data); if (pr.data.length > 0) setSelProf(pr.data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selProf) return;
    supabase.from("asignaciones").select("*, cursos(*), actividades(*)").eq("profesor_id", selProf).eq("semestre", sem).order("tipo_origen")
      .then(({ data }) => {
        setAsigs(data || []);
        setTotal((data || []).reduce((s: number, a: any) => s + Number(a.horas_efectivas), 0));
      });
  }, [selProf, sem]);

  const prof = profes.find(p => p.id === selProf);
  const HS = params?.horas_semestre || 1012;
  const faltan = Math.max(0, HS - total);

  return (
    <div>
      {/* Header */}
      <div className="bg-[#0070C0] rounded-[14px] px-6 py-5 mb-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] opacity-70 font-semibold uppercase tracking-wider mb-1">Mi Plan de Trabajo — {sem}</div>
            <div className="flex gap-3 items-center mb-2">
              <select value={selProf} onChange={e => setSelProf(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-sm font-bold cursor-pointer [&>option]:text-gray-800">
                {profes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <select value={sem} onChange={e => setSem(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-white/30 bg-white/15 text-white text-xs font-semibold cursor-pointer [&>option]:text-gray-800">
                {SEMESTRES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 text-[13px] opacity-85 items-center">
              <span>{prof?.programa}</span>
              <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-[11px] font-semibold">{prof?.perfil}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] opacity-60 font-semibold uppercase mb-1">Horas por asignar</div>
            <div className={`text-4xl font-black leading-none ${faltan > 0 ? "text-red-200" : "text-green-300"}`}>{faltan}</div>
            <div className="text-[11px] opacity-50 mt-0.5">de {HS} totales</div>
          </div>
        </div>
      </div>

      <div className="font-bold text-sm text-[#1B3A5C] mb-2.5">Compromisos asignados ({asigs.length})</div>

      {asigs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm">No hay compromisos asignados para este semestre.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {asigs.map((a, i) => {
            const desc = a.tipo_origen === "Curso" ? a.cursos?.curso : a.actividades?.actividad;
            return (
              <div key={a.id} className={`bg-white rounded-[10px] px-4 py-3 flex items-center gap-3 shadow-sm border-l-[3px] ${a.tipo_origen === "Curso" ? "border-l-[#2E75B6]" : "border-l-[#ED7D31]"}`}>
                <div className="w-6 text-center text-xs font-bold text-gray-400">{i + 1}</div>
                <div className="w-[70px]">
                  <Badge bg={a.tipo_origen === "Curso" ? "bg-blue-100" : "bg-orange-100"} text={a.tipo_origen === "Curso" ? "text-blue-700" : "text-orange-700"}>{a.tipo_origen}</Badge>
                </div>
                <div className="flex-1 font-semibold text-[13px]">{desc}</div>
                <CatBadge cat={a.categoria} />
                {a.duracion_meses !== "No aplica" && (
                  <Badge bg="bg-orange-100" text="text-orange-700">{a.duracion_meses}m</Badge>
                )}
                <Badge bg="bg-green-100" text="text-green-700">Asignado</Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Confidentiality notice */}
      <div className="mt-4 px-3.5 py-2.5 bg-[#FFF8E1] rounded-lg text-xs text-[#8B6914] border border-[#FFE082]">
        Esta vista no muestra el detalle de horas. Para información detallada, contacte a su coordinador de programa.
      </div>
    </div>
  );
}
