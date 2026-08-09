import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthenticatedUser } from "@/modules/auth/services/session.service";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERPiso - Gestión de Materiales",
  description: "Sistema ERP para venta de pisos y materiales de construcción",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  return (
    <html lang="es">
      <body className={inter.className}>
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
