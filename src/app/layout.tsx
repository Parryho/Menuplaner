import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Menüplan-Generator | JUFA Hotel Graz",
  description: "Professionelle Wochenmenüplanung für City und SÜD - JUFA Hotel Graz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} font-sans antialiased bg-primary-50 min-h-screen`}>
        <Navigation />

        {/* Main Content Area - offset for sidebar on desktop, for mobile header on mobile */}
        <div className="lg:pl-64 pt-16 lg:pt-0">
          <main className="min-h-screen">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

      </body>
    </html>
  );
}
