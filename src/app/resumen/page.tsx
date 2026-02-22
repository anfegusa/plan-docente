"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Parametros, Resumen as ResumenT, SEMESTRES } from "@/lib/types";
import { PerfilBadge, Badge, ProgressBar, PageHeader } from "@/components/ui";

export default function ResumenPage() {
  const [sem, setSem] = useState("2026-I");
  const [params, setParams] = useState<Parametros | null>(null);
  const [data, setData] = useState<ResumenT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { supabase.from("parametros").select("*").single().then(({ data }) => { if (data) setParams(data); }); }, []);
  useEffect(() => {
    setLoading(true);
    supabase.from("vista_resumen").select("*").eq("semestre", sem).order("nombre").then(({ data: d }) => { setData(d || []); setLoading(false); });
  }, [sem]);

  const HS = params?.horas_semestre || 1012;
  const HN = params?.horas_nucleo || 607;

  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <PageHeader title="Resumen por Profesor" subtitle={`Consolidado de cumplimiento — Semestre ${sem}`} />
        <select value={sem} onChange={e => setSem(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-[#1B3A5C] bg-white">
          {SEMESTRES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center text-gray-400 py-12">Cargando...</div> : (
        <div className="flex flex-col gap-2.5">
          {data.map(r => {
            const faltan = Math.max(0, HS - Number(r.total_horas));
            const c1012 = Number(r.total_horas) >= HS;
            const cNuc = Number(r.nucleo) >= HN;
            const borderColor = c1012 && cNuc ? "#92D050" : c1012 ? "#FFC000" : "#E63946";
            return (
              <div key={r.profesor_id} className="bg-white rounded-xl p-3.5 shadow-sm" style={{ borderLeft: `4px solid ${borderColor}` }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm">{r.nombre}</span>
                    <PerfilBadge perfil={r.perfil} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Cursos: <b className="text-gray-700">{r.nro_cursos}</b></span>
                    {c1012 && cNuc ? <Badge bg="bg-green-100" text="text-green-700">✓ Completo</Badge>
                      : c1012 ? <Badge bg="bg-yellow-100" text="text-yellow-700">⚠ Rev.</Badge>
                      : <Badge bg="bg-red-100" text="text-red-700">✗ Incompleto</Badge>}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400">Total horas: <b className="text-gray-700">{Number(r.total_horas)}</b> / {HS}</span>
                      <span className={`font-bold ${faltan > 0 ? "text-err" : "text-ok-dark"}`}>Faltan: {faltan}</span>
                    </div>
                    <ProgressBar value={Number(r.total_horas)} max={HS} />
                  </div>
                  <div className="w-40">
                    <div className="text-[11px] text-gray-400 mb-1">Núcleo: <b className="text-gray-700">{Number(r.nucleo)}</b> / {HN}</div>
                    <ProgressBar value={Number(r.nucleo)} max={HN} />
                  </div>
                  <div className="flex gap-1 text-[11px] text-gray-400">
                    {[["D", r.docencia], ["I", r.investigacion], ["Dr", r.direccion], ["O", r.otras]].map(([l, v]) => (
                      <span key={l as string} className={`px-1.5 py-0.5 rounded ${Number(v) > 0 ? "bg-blue-50 font-semibold text-gray-600" : "bg-gray-50"}`}>{l}:{Number(v)}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
