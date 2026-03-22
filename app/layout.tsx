import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PwaSetup from "@/components/PwaSetup";

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
      <head>
        <meta name="theme-color" content="#1A3A2A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Clinical Diet" />
      </head>
      <body className="bg-[#F4F7F5] min-h-screen">
        <PwaSetup />
        <Sidebar />
        {/* offset for mobile top bar */}
        <div className="pt-14 lg:pt-0 lg:pl-60">
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
