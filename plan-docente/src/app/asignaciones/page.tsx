"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Profesor, Curso, Actividad, Asignacion, Parametros, SEMESTRES } from "@/lib/types";
import { CatBadge, PerfilBadge, Badge, PageHeader } from "@/components/ui";
import toast from "react-hot-toast";

export default function Asignaciones() {
  const [params, setParams] = useState<Parametros | null>(null);
  const [profes, setProfes] = useState<Profesor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [activs, setActivs] = useState<Actividad[]>([]);
  const [selProf, setSelProf] = useState("");
  const [sem, setSem] = useState("2026-I");
  const [asigs, setAsigs] = useState<Asignacion[]>([]);
  const [tipo, setTipo] = useState<"Curso" | "Actividad">("Curso");
  const [selItem, setSelItem] = useState("");
  const [dur, setDur] = useState("No aplica");
  const [saving, setSaving] = useState(false);

  // Load base data
  useEffect(() => {
    Promise.all([
      supabase.from("parametros").select("*").single(),
      supabase.from("profesores").select("*").eq("estado", "Activo").order("nombre"),
      supabase.from("cursos").select("*").eq("estado", "Activo").order("curso"),
      supabase.from("actividades").select("*").eq("estado", "Activo").order("actividad"),
    ]).then(([p, pr, c, a]) => {
      if (p.data) setParams(p.data);
      if (pr.data) { setProfes(pr.data); if (pr.data.length > 0) setSelProf(pr.data[0].id); }
      if (c.data) setCursos(c.data);
      if (a.data) setActivs(a.data);
    });
  }, []);

  // Load assignments for selected professor+semester
  const loadAsigs = useCallback(async () => {
    if (!selProf) return;
    const { data } = await supabase
      .from("asignaciones")
      .select("*, cursos(*), actividades(*)")
      .eq("profesor_id", selProf)
      .eq("semestre", sem)
      .order("tipo_origen");
    setAsigs(data || []);
  }, [selProf, sem]);

  useEffect(() => { loadAsigs(); }, [loadAsigs]);

  // Computed
  const prof = profes.find(p => p.id === selProf);
  const HS = params?.horas_semestre || 1012;
  const maxC = prof?.perfil === "Plan Investigador" ? (params?.max_cursos_investigador || 1)
    : prof?.perfil === "Plan Profesor" ? (params?.max_cursos_profesor || 6) : 99;

  const doc = asigs.filter(a => a.categoria === "Docencia").reduce((s, a) => s + Number(a.horas_efectivas), 0);
  const inv = asigs.filter(a => a.categoria === "Investigación").reduce((s, a) => s + Number(a.horas_efectivas), 0);
  const dir = asigs.filter(a => a.categoria === "Dirección").reduce((s, a) => s + Number(a.horas_efectivas), 0);
  const otr = asigs.filter(a => a.categoria === "Otras").reduce((s, a) => s + Number(a.horas_efectivas), 0);
  const total = doc + inv + dir + otr;
  const faltan = Math.max(0, HS - total);
  const nCursos = asigs.filter(a => a.tipo_origen === "Curso").length;

  const itemsList = tipo === "Curso" ? cursos : activs;

  // Reset item selection when tipo changes
  useEffect(() => {
    setSelItem(itemsList.length > 0 ? itemsList[0].id : "");
    setDur("No aplica");
  }, [tipo, itemsList]);

  // Save assignment
  const handleSave = async () => {
    if (!selProf || !selItem) return;
    setSaving(true);

    // 1. Course limit check
    if (tipo === "Curso" && nCursos >= maxC) {
      toast.error(`${prof?.nombre} ya tiene ${nCursos} curso(s). Máximo para ${prof?.perfil} es ${maxC}.`);
      setSaving(false);
      return;
    }

    // 2. Duplicate check
    const dupFilter: any = { profesor_id: selProf, semestre: sem };
    if (tipo === "Curso") dupFilter.curso_id = selItem; else dupFilter.actividad_id = selItem;
    const { data: existing } = await supabase.from("asignaciones").select("id").match(dupFilter);
    if (existing && existing.length > 0) {
      toast.error("Este item ya está asignado a este profesor en este semestre.");
      setSaving(false);
      return;
    }

    // 3. Calculate hours
    const item = tipo === "Curso" ? cursos.find(c => c.id === selItem) : activs.find(a => a.id === selItem);
    if (!item) { setSaving(false); return; }
    const hBase = tipo === "Curso" ? (item as Curso).horas_semestrales : (item as Actividad).horas_base;
    const factor = dur === "12" ? 0.5 : dur === "24" ? 0.25 : 1;
    const cat = item.categoria;

    // 4. Save
    const { error } = await supabase.from("asignaciones").insert({
      profesor_id: selProf,
      semestre: sem,
      tipo_origen: tipo,
      curso_id: tipo === "Curso" ? selItem : null,
      actividad_id: tipo === "Actividad" ? selItem : null,
      duracion_meses: dur,
      horas_base: hBase,
      factor_semestral: factor,
      horas_efectivas: hBase * factor,
      categoria: cat,
    });

    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Asignación guardada");
      await loadAsigs();
    }
    setSaving(false);
  };

  // Delete assignment
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta asignación?")) return;
    await supabase.from("asignaciones").delete().eq("id", id);
    toast.success("Asignación eliminada");
    loadAsigs();
  };

  return (
    <div>
      <PageHeader title="Asignaciones" subtitle="Asignar cursos y actividades al plan de trabajo" />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Profesor</label>
          <select value={selProf} onChange={e => setSelProf(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px]">
            {profes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.id_profesor})</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Semestre</label>
          <select value={sem} onChange={e => setSem(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px]">
            {SEMESTRES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-[#1B3A5C] rounded-xl p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <div className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Profesor</div>
          <div className="text-white text-[15px] font-bold">{prof?.nombre || "—"}</div>
          {prof && <PerfilBadge perfil={prof.perfil} />}
        </div>
        {[["Docencia", doc], ["Investig.", inv], ["Dirección", dir], ["Otras", otr]].map(([l, v]) => (
          <div key={l as string} className="text-center min-w-[70px]">
            <div className="text-white/50 text-[10px] font-semibold">{l as string}</div>
            <div className="text-white text-lg font-extrabold">{v as number}</div>
          </div>
        ))}
        <div className="text-center px-4 py-1.5 rounded-lg bg-white/10 min-w-[80px]">
          <div className="text-white/50 text-[10px] font-semibold">TOTAL</div>
          <div className="text-white text-xl font-extrabold">{total}</div>
          <div className="text-white/40 text-[10px]">/ {HS}h</div>
        </div>
        <div className={`text-center px-4 py-1.5 rounded-lg min-w-[80px] ${faltan > 0 ? "bg-red-500/25" : "bg-green-500/25"}`}>
          <div className="text-white/50 text-[10px] font-semibold">FALTAN</div>
          <div className={`text-xl font-extrabold ${faltan > 0 ? "text-red-300" : "text-green-300"}`}>{faltan}</div>
        </div>
        <div className={`text-center px-3 py-1.5 rounded-lg min-w-[70px] ${nCursos > maxC ? "bg-red-500/25" : "bg-white/10"}`}>
          <div className="text-white/50 text-[10px] font-semibold">CURSOS</div>
          <div className={`text-lg font-extrabold ${nCursos > maxC ? "text-red-300" : "text-white"}`}>{nCursos}/{maxC}</div>
        </div>
      </div>

      {/* New assignment form */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
        <div className="font-bold text-[13px] text-[#1B3A5C] mb-3">Nueva asignación</div>
        <div className="flex gap-2.5 items-end flex-wrap">
          <div>
            <label className="text-[11px] font-semibold text-gray-400">Tipo</label>
            <div className="flex gap-1 mt-1">
              {(["Curso", "Actividad"] as const).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`px-4 py-[7px] rounded-md text-xs font-semibold transition-all ${
                    tipo === t ? "bg-[#2E75B6] text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-semibold text-gray-400">Item</label>
            <select value={selItem} onChange={e => {
              setSelItem(e.target.value);
              if (tipo === "Actividad") {
                const act = activs.find(a => a.id === e.target.value);
                setDur(act?.admite_duracion === "No aplica" ? "No aplica" : act?.admite_duracion || "No aplica");
              }
            }}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-xs">
              {itemsList.map(it => (
                <option key={it.id} value={it.id}>
                  {tipo === "Curso" ? `${(it as Curso).curso} (${(it as Curso).horas_semestrales}h)` : `${(it as Actividad).actividad} (${(it as Actividad).horas_base}h)`}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[120px]">
            <label className="text-[11px] font-semibold text-gray-400">Duración</label>
            <select value={dur} onChange={e => setDur(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-xs">
              <option>No aplica</option><option>12</option><option>24</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#548235] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#466D2B] disabled:opacity-50 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Existing assignments */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-bold text-[13px] text-[#1B3A5C]">
          Asignaciones actuales ({asigs.length})
        </div>
        {asigs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay asignaciones para este profesor en este semestre.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/80">
                {["Tipo","Descripción","Categoría","H. Base","Factor","H. Efectivas","Duración",""].map(h => (
                  <th key={h} className="px-3 py-2 text-gray-400 font-semibold text-[11px] uppercase border-b border-gray-100 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {asigs.map((a, i) => {
                const desc = a.tipo_origen === "Curso" ? a.cursos?.curso : a.actividades?.actividad;
                return (
                  <tr key={a.id} className={`border-b border-gray-50 ${i % 2 ? "bg-gray-50/40" : ""} hover:bg-blue-50/20`}>
                    <td className="px-3 py-2">
                      <Badge bg={a.tipo_origen === "Curso" ? "bg-blue-100" : "bg-orange-100"} text={a.tipo_origen === "Curso" ? "text-blue-700" : "text-orange-700"}>{a.tipo_origen}</Badge>
                    </td>
                    <td className="px-3 py-2 font-medium">{desc}</td>
                    <td className="px-3 py-2"><CatBadge cat={a.categoria} /></td>
                    <td className="px-3 py-2 text-center">{Number(a.horas_base)}</td>
                    <td className={`px-3 py-2 text-center font-semibold ${Number(a.factor_semestral) < 1 ? "text-ora" : "text-gray-400"}`}>×{Number(a.factor_semestral)}</td>
                    <td className="px-3 py-2 text-center font-bold">{Number(a.horas_efectivas)}</td>
                    <td className="px-3 py-2">{a.duracion_meses === "No aplica" ? "—" : a.duracion_meses + "m"}</td>
                    <td className="px-1.5 py-2 text-center">
                      <button onClick={() => handleDelete(a.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
