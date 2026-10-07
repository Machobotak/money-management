import type { Metadata } from "next";
import { Archivo, Spline_Sans_Mono } from "next/font/google";
import { SITE } from "@/config/site";
import { ToastProvider } from "@/components/ui/Toaster";
import "./globals.css";

/** UI voice: a grotesque with a printer's flatness. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

/** Ledger voice: every figure, key, and label that has to align in a column. */
const ledgerMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ledger-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={archivo.variable + " " + ledgerMono.variable}>
      <body className="font-sans text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
