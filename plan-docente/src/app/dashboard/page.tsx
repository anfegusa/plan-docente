"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Parametros, Resumen, SEMESTRES } from "@/lib/types";
import { KPICard, PerfilBadge, Dot, StatusBadge, PageHeader, SearchInput } from "@/components/ui";

export default function Dashboard() {
  const [sem, setSem] = useState("2026-I");
  const [params, setParams] = useState<Parametros | null>(null);
  const [data, setData] = useState<Resumen[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("parametros").select("*").single().then(({ data }) => { if (data) setParams(data); });
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.from("vista_resumen").select("*").eq("semestre", sem).then(({ data: d }) => {
      setData(d || []);
      setLoading(false);
    });
  }, [sem]);

  const HS = params?.horas_semestre || 1012;
  const HN = params?.horas_nucleo || 607;
  const filtered = data.filter(r => !search || r.nombre.toLowerCase().includes(search.toLowerCase()));
  const cumplen = data.filter(r => r.total_horas >= HS).length;
  const noCumplen = data.filter(r => r.total_horas < HS).length;
  const cumpleNuc = data.filter(r => r.nucleo >= HN).length;
  const totalFaltan = data.reduce((s, r) => s + Math.max(0, HS - r.total_horas), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <PageHeader title="Dashboard" subtitle={`Panel de control — Semestre ${sem}`} />
        <select value={sem} onChange={e => setSem(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-[#1B3A5C] bg-white">
          {SEMESTRES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <KPICard label="Profesores activos" value={data.length} color="#2E75B6" borderColor="#2E75B6" />
        <KPICard label="Planes semestre" value={data.length} color="#1B3A5C" borderColor="#1B3A5C" />
        <KPICard label="Cumplen 1012h" value={cumplen} color="#548235" borderColor="#548235" />
        <KPICard label="No cumplen" value={noCumplen} color="#E63946" borderColor="#E63946" />
        <KPICard label="Cumplen núcleo" value={cumpleNuc} color="#548235" borderColor="#92D050" />
        <KPICard label="Horas faltantes" value={totalFaltan.toLocaleString()} color="#ED7D31" borderColor="#ED7D31" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-sm text-[#1B3A5C]">Detalle por profesor</span>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar profesor..." />
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Cargando datos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/80">
                  {["Profesor","Perfil","Docencia","Investig.","Dirección","Otras","Total","Faltan","1012h","Núcleo","Estado"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-gray-400 font-semibold text-[11px] uppercase tracking-wide border-b border-gray-100 text-center first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const faltan = Math.max(0, HS - r.total_horas);
                  const c1012 = r.total_horas >= HS;
                  const cNuc = r.nucleo >= HN;
                  return (
                    <tr key={r.profesor_id} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"} hover:bg-blue-50/30 transition-colors`}>
                      <td className="px-3 py-2.5 text-left">
                        <div className="font-semibold">{r.nombre}</div>
                        <div className="text-[10px] text-gray-400">{r.programa}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center"><PerfilBadge perfil={r.perfil} /></td>
                      {[r.docencia, r.investigacion, r.direccion, r.otras].map((v, j) => (
                        <td key={j} className={`px-2 py-2.5 text-center ${Number(v) > 0 ? "font-semibold" : "text-gray-200"}`}>{Number(v)}</td>
                      ))}
                      <td className="px-2 py-2.5 text-center font-bold">{Number(r.total_horas)}</td>
                      <td className={`px-2 py-2.5 text-center font-bold ${faltan > 0 ? "text-err" : "text-ok-dark"}`}>{faltan}</td>
                      <td className="text-center"><Dot ok={c1012} /></td>
                      <td className="text-center"><Dot ok={cNuc} /></td>
                      <td className="text-center"><StatusBadge cumple1012={c1012} cumpleNucleo={cNuc} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
