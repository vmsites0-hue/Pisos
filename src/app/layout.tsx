import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthenticatedUser } from "@/modules/auth/services/session.service";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";

export const metadata: Metadata = {
  title: "Distri Pisos - Gestión de Materiales",
  description: "Sistema ERP para venta de pisos y materiales de construcción",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.svg", apple: "/icons/icon-192.svg" },
};

export const viewport: Viewport = { themeColor: "#0f172a" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  return (
    <html lang="es">
      <body style={{ fontFamily: "'Inter Variable', sans-serif" }}>
        <PwaRegistration />
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
              <Topbar userName={user.nombre} />
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        ) : children}
      </body>
    </html>
  );
}
