"use client";

import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

export default function ThemeSettings() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  const isDark = theme === "dark";

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between"
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        <span className="flex items-center gap-3">
          <span style={{ fontSize: 22, lineHeight: 1 }}>{isDark ? "🌙" : "☀️"}</span>
          <span className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {isDark ? "Koyu Tema" : "Açık Tema"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Görünümü anında değiştir
            </p>
          </span>
        </span>

        <span
          role="switch"
          aria-checked={isDark}
          aria-label="Tema değiştir"
          style={{
            width: 44,
            height: 26,
            borderRadius: 999,
            background: isDark ? "#7c3aed" : "#cbd5e1",
            position: "relative",
            flexShrink: 0,
            transition: "background 200ms ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: isDark ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              transition: "left 200ms ease",
            }}
          />
        </span>
      </button>
    </div>
  );
}
