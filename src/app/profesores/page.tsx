"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profesor } from "@/lib/types";
import { PerfilBadge, EstadoBadge, PageHeader, SearchInput } from "@/components/ui";
import toast from "react-hot-toast";

const empty: Omit<Profesor, "id"> = { id_profesor: "", nombre: "", programa: "", perfil: "Plan Profesor", estado: "Activo", email: "" };

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] bg-gray-50 disabled:opacity-50" />
    </div>
  );
}

export default function Profesores() {
  const [list, setList] = useState<Profesor[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...empty });
  const [search, setSearch] = useState("");
  const [isNew, setIsNew] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("profesores").select("*").order("nombre");
    setList(data || []);
    if (data && data.length > 0 && !selId) { setSelId(data[0].id); setForm(data[0]); }
  };
  useEffect(() => { load(); }, []);

  const select = (p: Profesor) => { setSelId(p.id); setForm({ ...p }); setIsNew(false); };
  const filtered = list.filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase()));

  const handleNew = () => { setIsNew(true); setSelId(null); setForm({ ...empty }); };
  const handleSave = async () => {
    if (!form.id_profesor || !form.nombre) { toast.error("Completa ID y Nombre"); return; }
    if (isNew) {
      const { error } = await supabase.from("profesores").insert({ id_profesor: form.id_profesor, nombre: form.nombre, programa: form.programa, perfil: form.perfil, estado: form.estado, email: form.email });
      if (error) { toast.error(error.message); return; }
      toast.success("Profesor creado");
    } else {
      const { error } = await supabase.from("profesores").update({ id_profesor: form.id_profesor, nombre: form.nombre, programa: form.programa, perfil: form.perfil, estado: form.estado, email: form.email }).eq("id", selId);
      if (error) { toast.error(error.message); return; }
      toast.success("Cambios guardados");
    }
    await load();
    setIsNew(false);
  };
  const handleDelete = async () => {
    if (!selId || !confirm("¿Eliminar este profesor?")) return;
    await supabase.from("profesores").delete().eq("id", selId);
    toast.success("Profesor eliminado");
    setSelId(null); setForm({ ...empty });
    load();
  };

  return (
    <div>
      <PageHeader title="Profesores" subtitle="Gestión del registro de profesores" />
      <div className="flex gap-4">
        {/* Left panel */}
        <div className="w-[340px] bg-white rounded-xl shadow-sm overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-gray-100 flex gap-2">
            <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Buscar..." /></div>
            <button onClick={handleNew} className="bg-[#2E75B6] text-white rounded-lg px-3.5 text-xs font-semibold flex items-center gap-1 hover:bg-[#2563a0]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo
            </button>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.map(p => (
              <div key={p.id} onClick={() => select(p)}
                className={`px-3.5 py-2.5 border-b border-gray-50 cursor-pointer transition-all ${selId === p.id ? "bg-blue-50/50 border-l-[3px] border-l-[#2E75B6]" : "border-l-[3px] border-l-transparent hover:bg-gray-50"}`}>
                <div className="font-semibold text-[13px]">{p.nombre}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[11px] text-gray-400">{p.id_profesor}</span>
                  <PerfilBadge perfil={p.perfil} />
                  <EstadoBadge estado={p.estado} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-[#1B3A5C]">{isNew ? "Nuevo profesor" : "Editar profesor"}</h2>
            <div className="flex gap-2">
              {!isNew && selId && (
                <button onClick={handleDelete} className="px-4 py-[7px] rounded-lg border border-gray-200 text-xs font-semibold text-red-500 flex items-center gap-1 hover:bg-red-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  Eliminar
                </button>
              )}
              <button onClick={handleSave} className="px-4 py-[7px] rounded-lg bg-[#2E75B6] text-white text-xs font-semibold hover:bg-[#2563a0]">
                {isNew ? "Crear profesor" : "Guardar cambios"}
              </button>
            </div>
          </div>
          <Field label="ID Profesor" value={form.id_profesor || ""} onChange={v => setForm({ ...form, id_profesor: v })} disabled={!isNew} />
          <Field label="Nombre completo" value={form.nombre || ""} onChange={v => setForm({ ...form, nombre: v })} />
          <Field label="Programa académico" value={form.programa || ""} onChange={v => setForm({ ...form, programa: v })} />
          <div className="flex gap-3.5">
            <div className="flex-1 mb-3.5">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Perfil</label>
              <select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] bg-gray-50">
                <option>Plan Profesor</option><option>Plan Investigador</option><option>Plan Administrativo</option>
              </select>
            </div>
            <div className="flex-1 mb-3.5">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] bg-gray-50">
                <option>Activo</option><option>Inactivo</option>
              </select>
            </div>
          </div>
          <Field label="Email" value={form.email || ""} onChange={v => setForm({ ...form, email: v })} />
        </div>
      </div>
    </div>
  );
}

