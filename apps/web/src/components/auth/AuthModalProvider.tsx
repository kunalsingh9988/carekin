"use client";

import { createContext, useContext, useState } from "react";
import type { UserRoleValue } from "@/lib/validation/schemas";

interface AuthModalContextValue {
  isOpen: boolean;
  defaultRole: UserRoleValue;
  open: (defaultRole?: UserRoleValue) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultRole, setDefaultRole] = useState<UserRoleValue>("family");

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        defaultRole,
        open: (role) => {
          setDefaultRole(role ?? "family");
          setIsOpen(true);
        },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
