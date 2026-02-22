export function Badge({ children, bg, text }: { children: React.ReactNode; bg: string; text: string }) {
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${bg} ${text}`}>{children}</span>;
}

export function CatBadge({ cat }: { cat: string }) {
  const m: Record<string, [string, string]> = {
    Docencia: ["bg-blue-100", "text-blue-700"],
    Investigación: ["bg-purple-100", "text-purple-700"],
    Dirección: ["bg-orange-100", "text-orange-700"],
    Otras: ["bg-gray-100", "text-gray-600"],
  };
  const [bg, tx] = m[cat] || ["bg-gray-100", "text-gray-600"];
  return <Badge bg={bg} text={tx}>{cat}</Badge>;
}

export function PerfilBadge({ perfil }: { perfil: string }) {
  const label = perfil.replace("Plan ", "");
  const m: Record<string, [string, string]> = {
    "Plan Profesor": ["bg-blue-100", "text-blue-700"],
    "Plan Investigador": ["bg-purple-100", "text-purple-700"],
    "Plan Administrativo": ["bg-orange-100", "text-orange-700"],
  };
  const [bg, tx] = m[perfil] || ["bg-gray-100", "text-gray-600"];
  return <Badge bg={bg} text={tx}>{label}</Badge>;
}

export function EstadoBadge({ estado }: { estado: string }) {
  return estado === "Activo"
    ? <Badge bg="bg-green-100" text="text-green-700">Activo</Badge>
    : <Badge bg="bg-gray-100" text="text-gray-500">Inactivo</Badge>;
}

export function KPICard({ label, value, color, borderColor }: { label: string; value: string | number; color: string; borderColor: string }) {
  return (
    <div className={`flex-1 min-w-[130px] bg-white rounded-xl p-4 shadow-sm border-t-[3px]`} style={{ borderTopColor: borderColor }}>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</div>
      <div className="text-[30px] font-extrabold leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

export function ProgressBar({ value, max, width = "w-full" }: { value: number; max: number; width?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 100 ? "bg-ok" : pct >= 80 ? "bg-warn" : "bg-err";
  return (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${width}`}>
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "bg-ok" : "bg-err"}`} />;
}

export function StatusBadge({ cumple1012, cumpleNucleo }: { cumple1012: boolean; cumpleNucleo: boolean }) {
  if (cumple1012 && cumpleNucleo) return <Badge bg="bg-green-100" text="text-green-700">Completo</Badge>;
  if (cumple1012) return <Badge bg="bg-yellow-100" text="text-yellow-700">Rev.</Badge>;
  return <Badge bg="bg-red-100" text="text-red-700">Incompleto</Badge>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-extrabold text-[#1B3A5C]">{title}</h1>
      <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="bg-transparent text-xs outline-none w-full placeholder:text-gray-400" />
    </div>
  );
}
