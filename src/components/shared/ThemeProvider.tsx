"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initTheme = useThemeStore((state) => state.initTheme);
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    initTheme();
    checkSession();
  }, [initTheme, checkSession]);

  return <>{children}</>;
}
