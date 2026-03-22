import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Clinical Diet",
  description: "Monitoramento de dieta pessoal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F4F7F5] min-h-screen">
        <Sidebar />
        {/* offset for mobile top bar */}
        <div className="pt-14 lg:pt-0 lg:pl-60">
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
