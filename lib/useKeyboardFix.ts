"use client";
import { useEffect } from "react";

// iOS PWA'da klavye window.innerHeight'ı değiştirmez ama
// visualViewport.height'ı küçültür. Farkı padding olarak ekleyip
// aktif input'u görünür kılıyoruz.
export function useKeyboardFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    function onViewportChange() {
      const kbHeight = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop);
      document.documentElement.style.setProperty("--kb-height", `${kbHeight}px`);

      if (kbHeight > 50) {
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
        }
      }
    }

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
    };
  }, []);
}
