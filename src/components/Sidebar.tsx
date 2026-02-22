"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-4a1 1 0 011-1h2a1 1 0 011 1v4" },
  { href: "/profesores", label: "Profesores", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m9-3a4 4 0 100-8 4 4 0 000 8zm11 9v-2a4 4 0 00-3-3.87" },
  { href: "/catalogos", label: "Catálogos", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/asignaciones", label: "Asignaciones", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/resumen", label: "Resumen", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/mi-plan", label: "Mi Plan", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { href: "/parametros", label: "Parámetros", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function Sidebar() {
  const path = usePathname();
  const [institucion, setInstitucion] = useState("Cargando...");

  useEffect(() => {
    supabase.from("parametros").select("institucion").single().then(({ data }) => {
      if (data) setInstitucion(data.institucion);
    });
  }, []);

  return (
    <aside className="w-[210px] min-h-screen bg-[#1B2A4A] flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2E75B6] to-[#0070C0] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">PT</span>
        </div>
        <div>
          <div className="text-white font-bold text-[13px] leading-tight">Plan de Trabajo</div>
          <div className="text-white/40 text-[10px]">{institucion}</div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2">
        {items.map(item => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg mb-0.5 transition-all ${
                active ? "bg-[#2E75B6]" : "hover:bg-white/[0.06]"
              }`}>
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
              <span className={`text-[13px] ${active ? "text-white font-semibold" : "text-white/60"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-2.5 border-t border-white/[0.08] text-white/25 text-[10px]">v2.0 · Plan Docente</div>
    </aside>
  );
}
