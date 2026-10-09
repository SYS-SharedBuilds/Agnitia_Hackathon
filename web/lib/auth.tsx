"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "registrar";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  isSimulated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loginAs: (role: UserRole, customName?: string, customOrg?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEMO_USERS: Record<UserRole, AuthUser> = {
  registrar: {
    id: "usr_reg_1048",
    name: "Aanya Patel",
    email: "aanya.patel@bharat-telecom.in",
    role: "registrar",
    organization: "Bharat Telecom Registrar Services (Partner Circle DL-14)",
    isSimulated: true,
  },
  admin: {
    id: "usr_noc_4091",
    name: "Aarav Sharma",
    email: "aarav.sharma@switchon.internal",
    role: "admin",
    organization: "SwitchOn Central Network Operations Command",
    isSimulated: true,
  },
};

const AuthContext = createContext<AuthContextType>({
  user: DEMO_USERS.registrar,
  role: "registrar",
  loginAs: () => {},
  logout: () => {},
  switchRole: () => {},
});

const AUTH_STORAGE_KEY = "switchon_portal_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_USERS.registrar);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === "admin" || parsed.role === "registrar")) {
          setUser(parsed);
          return;
        }
      }
    } catch {
      // Fallback to default registrar
    }
    setUser(DEMO_USERS.registrar);
  }, []);

  const loginAs = (role: UserRole, customName?: string, customOrg?: string) => {
    const base = DEMO_USERS[role];
    const updated: AuthUser = {
      ...base,
      name: customName || base.name,
      organization: customOrg || base.organization,
    };
    setUser(updated);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  const switchRole = (newRole: UserRole) => {
    loginAs(newRole);
    if (newRole === "admin") {
      router.push("/");
    } else {
      router.push("/registrar");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "registrar",
        loginAs,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
