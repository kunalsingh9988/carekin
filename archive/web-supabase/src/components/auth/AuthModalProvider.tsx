"use client";

import { createContext, useContext, useState } from "react";

interface AuthModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// Global so the navbar button and any future "you need to log in for this"
// prompt can open the same popup, instead of each place navigating to a
// dedicated page (Section: homepage first, login is an overlay, not a
// forced redirect).
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
