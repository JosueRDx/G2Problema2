// /frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext"; // <-- 1. Import AuthProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rueda de Problemas - UNSA",
  description: "Conectando Desafíos con Soluciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white`}>
        {/* 2. Wrap the main content area with AuthProvider */}
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar /> {/* Now Navbar is inside the provider */}
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider> {/* 3. Close the provider */}
      </body>
    </html>
  );
}