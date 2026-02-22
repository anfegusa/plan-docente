"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profesor, Asignacion, Parametros, SEMESTRES } from "@/lib/types";
import { Badge, CatBadge } from "@/components/ui";

function generatePDF(
  prof: Profesor,
  sem: string,
  asigs: Asignacion[],
  params: Parametros,
  total: number
) {
  import("jspdf").then(({ jsPDF }) => {
    import("jspdf-autotable").then((autoTableModule) => {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const autoTable = autoTableModule.default;
      const W = doc.internal.pageSize.getWidth();
      const margin = 20;
      const usable = W - margin * 2;
      let y = 20;

      const azul = [27, 58, 92] as [number, number, number];
      const azul2 = [46, 117, 182] as [number, number, number];
      const grisClaro = [245, 245, 245] as [number, number, number];

      // ─── Header bar ───
      doc.setFillColor(...azul);
      doc.rect(0, 0, W, 32, "F");
      doc.setFillColor(...azul2);
      doc.rect(0, 32, W, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(params.institucion.toUpperCase(), margin, 14);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Plan de Trabajo Docente", margin, 22);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Semestre ${sem}`, W - margin, 14, { align: "right" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const fecha = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
      doc.text(`Generado: ${fecha}`, W - margin, 22, { align: "right" });

      y = 45;

      // ─── Professor info box ───
      doc.setFillColor(...grisClaro);
      doc.roundedRect(margin, y, usable, 30, 2, 2, "F");
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, y, usable, 30, 2, 2, "S");

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text("PROFESOR", margin + 5, y + 7);
      doc.text("ID", margin + usable * 0.55, y + 7);
      doc.text("PROGRAMA", margin + 5, y + 20);
      doc.text("PERFIL", margin + usable * 0.55, y + 20);

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(prof.nombre, margin + 5, y + 13);
      doc.setFont("helvetica", "normal");
      doc.text(prof.id_profesor, margin + usable * 0.55, y + 13);
      doc.text(prof.programa, margin + 5, y + 26);

      doc.setFillColor(...azul2);
      doc.roundedRect(margin + usable * 0.55, y + 21, 35, 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(prof.perfil.replace("Plan ", ""), margin + usable * 0.55 + 3, y + 25.5);

      y += 38;

      // ─── Summary line ───
      const faltan = Math.max(0, params.horas_semestre - total);
      doc.setFontSize(10);
      doc.setTextColor(...azul);
      doc.setFont("helvetica", "bold");
      doc.text(`Total compromisos: ${asigs.length}`, margin, y);
      doc.text(
        `Horas asignadas: ${total} / ${params.horas_semestre}h  |  Por asignar: ${faltan}h`,
        W - margin, y, { align: "right" }
      );

      y += 8;

      // ─── Commitments table ───
      const cursoRows = asigs
        .filter(a => a.tipo_origen === "Curso")
        .map((a, i) => [
          String(i + 1),
          "Curso",
          a.cursos?.curso || "—",
          a.categoria,
          a.duracion_meses === "No aplica" ? "—" : a.duracion_meses + " meses",
        ]);

      const actividadRows = asigs
        .filter(a => a.tipo_origen === "Actividad")
        .map((a, i) => [
          String(cursoRows.length + i + 1),
          "Actividad",
          a.actividades?.actividad || "—",
          a.categoria,
          a.duracion_meses === "No aplica" ? "—" : a.duracion_meses + " meses",
        ]);

      const allRows = [...cursoRows, ...actividadRows];

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["#", "Tipo", "Descripción", "Categoría", "Duración"]],
        body: allRows,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: azul,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" as const },
          1: { cellWidth: 22 },
          2: { cellWidth: "auto" as const },
          3: { cellWidth: 28 },
          4: { cellWidth: 25, halign: "center" as const },
        },
        didParseCell: function (data: any) {
          if (data.section === "body" && data.column.index === 1) {
            if (data.cell.raw === "Curso") {
              data.cell.styles.textColor = azul2;
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [237, 125, 49];
              data.cell.styles.fontStyle = "bold";
            }
          }
          if (data.section === "body" && data.column.index === 3) {
            const cat = data.cell.raw;
            if (cat === "Docencia") data.cell.styles.textColor = azul2;
            else if (cat === "Investigación") data.cell.styles.textColor = [124, 58, 237];
            else if (cat === "Dirección") data.cell.styles.textColor = [237, 125, 49];
            else data.cell.styles.textColor = [107, 114, 128];
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      // ─── Category summary ───
      const cats: Record<string, number> = {};
      asigs.forEach(a => {
        const cat = a.categoria;
        cats[cat] = (cats[cat] || 0) + Number(a.horas_efectivas);
      });

      doc.setFillColor(...grisClaro);
      doc.roundedRect(margin, y, usable, 20, 2, 2, "F");
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, y, usable, 20, 2, 2, "S");

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN DE HORAS POR CATEGORÍA", margin + 5, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      let xPos = margin + 5;
      Object.entries(cats).forEach(([cat, horas]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${cat}: `, xPos, y + 14);
        const catW = doc.getTextWidth(`${cat}: `);
        doc.setFont("helvetica", "normal");
        doc.text(`${horas}h`, xPos + catW, y + 14);
        xPos += catW + doc.getTextWidth(`${horas}h`) + 10;
      });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...azul);
      doc.text(`TOTAL: ${total}h / ${params.horas_semestre}h`, W - margin - 5, y + 14, { align: "right" });

      y += 28;

      // ─── Note ───
      doc.setFontSize(8);
      doc.setTextColor(139, 105, 20);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Este documento refleja los compromisos académicos asignados. Las horas detalladas están sujetas a revisión por la coordinación.",
        margin, y, { maxWidth: usable }
      );

      y += 14;

      // ─── Signature lines ───
      const pageH = doc.internal.pageSize.getHeight();
      const sigY = Math.max(y + 20, pageH - 55);

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);

      const sigW = usable * 0.4;
      doc.line(margin, sigY, margin + sigW, sigY);
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text(prof.nombre, margin + sigW / 2, sigY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Profesor — " + prof.id_profesor, margin + sigW / 2, sigY + 10, { align: "center" });
      doc.text(prof.programa, margin + sigW / 2, sigY + 15, { align: "center" });

      const sigX2 = W - margin - sigW;
      doc.line(sigX2, sigY, W - margin, sigY);
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text("Coordinador(a) de Programa", sigX2 + sigW / 2, sigY + 5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(prof.programa, sigX2 + sigW / 2, sigY + 10, { align: "center" });
      doc.text(params.institucion, sigX2 + sigW / 2, sigY + 15, { align: "center" });

      // ─── Footer ───
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `${params.institucion} — Plan de Trabajo Docente — ${sem} — Generado el ${fecha}`,
        W / 2, pageH - 10, { align: "center" }
      );

      const fileName = `Plan_Trabajo_${prof.id_profesor}_${prof.nombre.replace(/\s+/g, "_")}_${sem}.pdf`;
      doc.save(fileName);
    });
  });
}

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

  const handlePDF = () => {
    if (!prof || !params) return;
    generatePDF(prof, sem, asigs, params, total);
  };

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
          <div className="flex items-start gap-4">
            <button onClick={handlePDF} disabled={asigs.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Descargar PDF
            </button>
            <div className="text-center">
              <div className="text-[11px] opacity-60 font-semibold uppercase mb-1">Horas por asignar</div>
              <div className={`text-4xl font-black leading-none ${faltan > 0 ? "text-red-200" : "text-green-300"}`}>{faltan}</div>
              <div className="text-[11px] opacity-50 mt-0.5">de {HS} totales</div>
            </div>
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

      <div className="mt-4 px-3.5 py-2.5 bg-[#FFF8E1] rounded-lg text-xs text-[#8B6914] border border-[#FFE082]">
        Esta vista no muestra el detalle de horas. Para información detallada, contacte a su coordinador de programa.
      </div>
    </div>
  );
}
