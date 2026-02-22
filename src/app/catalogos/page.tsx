"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Curso, Actividad } from "@/lib/types";
import { CatBadge, EstadoBadge, Badge, PageHeader, SearchInput } from "@/components/ui";
import toast from "react-hot-toast";

export default function Catalogos() {
  const [tab, setTab] = useState<"Cursos" | "Actividades">("Cursos");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [activs, setActivs] = useState<Actividad[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const load = async () => {
    const [c, a] = await Promise.all([
      supabase.from("cursos").select("*").order("curso"),
      supabase.from("actividades").select("*").order("actividad"),
    ]);
    setCursos(c.data || []);
    setActivs(a.data || []);
  };
  useEffect(() => { load(); }, []);

  const fCursos = cursos.filter(c => !search || c.curso.toLowerCase().includes(search.toLowerCase()));
  const fActivs = activs.filter(a => !search || a.actividad.toLowerCase().includes(search.toLowerCase()));

  const handleNewCurso = () => { setIsNew(true); setEditing({ id_curso: "", curso: "", categoria: "Docencia", horas_semestrales: 0, estado: "Activo" }); };
  const handleNewActiv = () => { setIsNew(true); setEditing({ id_actividad: "", actividad: "", categoria: "Investigación", horas_base: 0, admite_duracion: "No aplica", estado: "Activo" }); };

  const handleSave = async () => {
    if (!editing) return;
    const table = tab === "Cursos" ? "cursos" : "actividades";
    if (isNew) {
      const { error } = await supabase.from(table).insert(editing);
      if (error) { toast.error(error.message); return; }
      toast.success(`${tab === "Cursos" ? "Curso" : "Actividad"} creado(a)`);
    } else {
      const { id, ...rest } = editing;
      const { error } = await supabase.from(table).update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Cambios guardados");
    }
    setEditing(null); setIsNew(false); load();
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await supabase.from(table).delete().eq("id", id);
    toast.success("Eliminado"); load();
  };

  return (
    <div>
      <PageHeader title="Catálogos" subtitle="Cursos y actividades disponibles" />

      {/* Tabs */}
      <div className="flex gap-0.5 mb-4">
        {(["Cursos", "Actividades"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); setEditing(null); }}
            className={`px-6 py-2 rounded-t-lg text-[13px] font-semibold transition-all ${tab === t ? "bg-[#2E75B6] text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}>{t}</button>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-blue-200">
          <div className="font-bold text-sm text-[#1B3A5C] mb-3">{isNew ? "Nuevo" : "Editar"} {tab === "Cursos" ? "curso" : "actividad"}</div>
          <div className="flex gap-3 flex-wrap items-end">
            {tab === "Cursos" ? (<>
              <div className="w-24"><label className="text-[10px] font-semibold text-gray-400">ID</label>
                <input value={editing.id_curso} onChange={e => setEditing({ ...editing, id_curso: e.target.value })} disabled={!isNew} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
              <div className="flex-1 min-w-[200px]"><label className="text-[10px] font-semibold text-gray-400">Nombre</label>
                <input value={editing.curso} onChange={e => setEditing({ ...editing, curso: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
              <div className="w-32"><label className="text-[10px] font-semibold text-gray-400">Categoría</label>
                <select value={editing.categoria} onChange={e => setEditing({ ...editing, categoria: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs">
                  <option>Docencia</option><option>Investigación</option><option>Dirección</option><option>Otras</option></select></div>
              <div className="w-20"><label className="text-[10px] font-semibold text-gray-400">Horas</label>
                <input type="number" value={editing.horas_semestrales} onChange={e => setEditing({ ...editing, horas_semestrales: +e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
            </>) : (<>
              <div className="w-24"><label className="text-[10px] font-semibold text-gray-400">ID</label>
                <input value={editing.id_actividad} onChange={e => setEditing({ ...editing, id_actividad: e.target.value })} disabled={!isNew} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
              <div className="flex-1 min-w-[200px]"><label className="text-[10px] font-semibold text-gray-400">Nombre</label>
                <input value={editing.actividad} onChange={e => setEditing({ ...editing, actividad: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
              <div className="w-32"><label className="text-[10px] font-semibold text-gray-400">Categoría</label>
                <select value={editing.categoria} onChange={e => setEditing({ ...editing, categoria: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs">
                  <option>Docencia</option><option>Investigación</option><option>Dirección</option><option>Otras</option></select></div>
              <div className="w-20"><label className="text-[10px] font-semibold text-gray-400">Horas</label>
                <input type="number" value={editing.horas_base} onChange={e => setEditing({ ...editing, horas_base: +e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs" /></div>
              <div className="w-28"><label className="text-[10px] font-semibold text-gray-400">Duración</label>
                <select value={editing.admite_duracion} onChange={e => setEditing({ ...editing, admite_duracion: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border border-gray-200 text-xs">
                  <option>No aplica</option><option>12</option><option>24</option></select></div>
            </>)}
            <button onClick={handleSave} className="px-4 py-1.5 rounded-lg bg-[#548235] text-white text-xs font-bold hover:bg-[#466D2B]">Guardar</button>
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-1.5 rounded-lg border text-xs font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <SearchInput value={search} onChange={setSearch} placeholder={`Buscar ${tab.toLowerCase()}...`} />
          <button onClick={tab === "Cursos" ? handleNewCurso : handleNewActiv}
            className="bg-[#2E75B6] text-white rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-[#2563a0]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Nuevo {tab === "Cursos" ? "curso" : "actividad"}
          </button>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50/80">
            {(tab === "Cursos" ? ["ID","Curso","Categoría","Horas Sem.","Estado",""] : ["ID","Actividad","Categoría","Horas Base","Duración","Estado",""]).map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-gray-400 font-semibold text-[11px] uppercase tracking-wide border-b border-gray-100">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {tab === "Cursos" ? fCursos.map((c, i) => (
              <tr key={c.id} className={`border-b border-gray-50 ${i % 2 ? "bg-gray-50/40" : ""} hover:bg-blue-50/20 cursor-pointer`} onClick={() => { setEditing({ ...c }); setIsNew(false); }}>
                <td className="px-3 py-2.5 font-semibold text-[#2E75B6]">{c.id_curso}</td>
                <td className="px-3 py-2.5 font-medium">{c.curso}</td>
                <td className="px-3 py-2.5"><CatBadge cat={c.categoria} /></td>
                <td className="px-3 py-2.5 font-semibold">{c.horas_semestrales}h</td>
                <td className="px-3 py-2.5"><EstadoBadge estado={c.estado} /></td>
                <td className="px-1.5"><button onClick={e => { e.stopPropagation(); handleDelete("cursos", c.id); }} className="opacity-30 hover:opacity-100">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button></td>
              </tr>
            )) : fActivs.map((a, i) => (
              <tr key={a.id} className={`border-b border-gray-50 ${i % 2 ? "bg-gray-50/40" : ""} hover:bg-blue-50/20 cursor-pointer`} onClick={() => { setEditing({ ...a }); setIsNew(false); }}>
                <td className="px-3 py-2.5 font-semibold text-[#2E75B6]">{a.id_actividad}</td>
                <td className="px-3 py-2.5 font-medium">{a.actividad}</td>
                <td className="px-3 py-2.5"><CatBadge cat={a.categoria} /></td>
                <td className="px-3 py-2.5 font-semibold">{a.horas_base}h</td>
                <td className="px-3 py-2.5"><Badge bg={a.admite_duracion !== "No aplica" ? "bg-orange-100" : "bg-gray-100"} text={a.admite_duracion !== "No aplica" ? "text-orange-700" : "text-gray-400"}>{a.admite_duracion === "No aplica" ? "—" : a.admite_duracion + "m"}</Badge></td>
                <td className="px-3 py-2.5"><EstadoBadge estado={a.estado} /></td>
                <td className="px-1.5"><button onClick={e => { e.stopPropagation(); handleDelete("actividades", a.id); }} className="opacity-30 hover:opacity-100">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
