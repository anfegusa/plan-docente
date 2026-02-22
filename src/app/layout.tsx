import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = { title: "Plan de Trabajo Docente", description: "Gestión de carga académica" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#F0F2F5]">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Sidebar />
        <main className="ml-[210px] min-h-screen p-6">{children}</main>
      </body>
    </html>
  );
}
