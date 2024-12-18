import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { GraphProvider } from "@/app/store/graphStore";
import { ActionProvider } from "@/app/store/actionStore";
import { AuthProvider } from "@/app/store/basicAuthProvider";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Figma Automation",
  description: "Automate Figma with Playwright",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased relative
        bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] 
        from-slate-900 via-gray-900 to-black min-h-screen h-full`}
        >
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
          <header className="border-b border-slate-800/20">
            <div className="max-w-[2000px] mx-auto px-8 py-6 flex justify-between items-center">
              <Link
                href="/"
                className="text-2xl tracking-[0.2em] font-extralight text-slate-200"
              >
                FEATURELY<span className="text-slate-600">.AI</span>
              </Link>
              <nav className="flex gap-8">
                {["Platform", "Documentation", "Support"].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    className="text-sm tracking-[0.15em] text-slate-400 hover:text-slate-200 
                           transition-colors uppercase font-light"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <GraphProvider>
            <ActionProvider>
              <div className="relative max-w-[2000px] mx-auto px-8 py-10">
                {children}
              </div>
            </ActionProvider>
          </GraphProvider>
          <Toaster />
        </body>
      </AuthProvider>
    </html>
  );
}
