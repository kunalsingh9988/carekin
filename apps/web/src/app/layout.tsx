import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { Navbar } from "@/components/layout/Navbar";
import { SeedInitializer } from "@/components/SeedInitializer";
import { THEME_INIT_SCRIPT } from "@/lib/storage/client";

// Loaded here so tokens.css's font var references actually resolve to
// registered @font-faces. Brand pairing B: Bricolage Grotesque for display
// (>=28px headings only), Figtree for UI, Noto Sans Devanagari for Hindi —
// all variable fonts, so no weight list needed.
const bricolageGrotesque = Bricolage_Grotesque({ variable: "--next-font-bricolage-grotesque", subsets: ["latin"] });
const figtree = Figtree({ variable: "--next-font-figtree", subsets: ["latin"] });
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--next-font-noto-sans-devanagari",
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: { default: "CareKin", template: "%s · CareKin" },
  description: "Verified elder care and babysitting, close to home. (Prototype — no real backend.)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${bricolageGrotesque.variable} ${figtree.variable} ${notoSansDevanagari.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
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
