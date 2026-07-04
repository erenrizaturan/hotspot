"use client";

export const THEME_KEY = "hotspot_theme";

export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}
