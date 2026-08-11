import type { Metadata } from "next";
import { Anek_Devanagari, Anek_Latin, IBM_Plex_Sans, IBM_Plex_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { Navbar } from "@/components/layout/Navbar";
import { SeedInitializer } from "@/components/SeedInitializer";

// Loaded here so tokens.css's `font-family: "Anek Latin", ...` etc. actually
// resolve to a registered @font-face, not just a name the browser can't
// find. Devanagari cuts loaded alongside their Latin counterparts per
// Section 6's non-negotiable Hindi-support requirement.
const anekLatin = Anek_Latin({ variable: "--next-font-anek-latin", subsets: ["latin"] });
const anekDevanagari = Anek_Devanagari({ variable: "--next-font-anek-devanagari", subsets: ["devanagari"] });
const ibmPlexSans = IBM_Plex_Sans({ variable: "--next-font-ibm-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const ibmPlexSansDevanagari = IBM_Plex_Sans_Devanagari({
  variable: "--next-font-ibm-plex-sans-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CareKin",
  description: "Verified elder care and babysitting, close to home. (Prototype — no real backend.)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anekLatin.variable} ${anekDevanagari.variable} ${ibmPlexSans.variable} ${ibmPlexSansDevanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg-canvas text-text-primary">
        <SeedInitializer />
        <AuthModalProvider>
          <Navbar />
          {children}
          <AuthModal />
        </AuthModalProvider>
      </body>
    </html>
  );
}
