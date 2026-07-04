"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface PinInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  shake?: boolean;
  success?: boolean;
  disabled?: boolean;
}

export default function PinInput({ value, onChange, shake, success, disabled }: PinInputProps) {
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < 3) {
      refs[index + 1].current?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        const next = [...value];
        next[index - 1] = "";
        onChange(next);
        refs[index - 1].current?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs[index - 1].current?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      refs[index + 1].current?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    onChange(next);
    const focusIdx = Math.min(text.length, 3);
    refs[focusIdx].current?.focus();
  }

  const borderColor = success
    ? "#10b981"
    : shake
    ? "#ef4444"
    : undefined;

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => {
        const filled = !!value[i];
        const activeBorder = borderColor ?? (filled ? "#7c3aed" : "#2d1f4e");
        return (
          <div key={i} style={{ position: "relative" }}>
            <input
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={value[i] ? "•" : ""}
              onChange={(e) => handleChange(i, e.target.value === "•" ? value[i] : e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={disabled}
              autoComplete="off"
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                border: `2px solid ${activeBorder}`,
                background: "var(--bg-input)",
                color: filled ? (success ? "#10b981" : shake ? "#ef4444" : "#7c3aed") : "transparent",
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
                transition: "border-color 150ms ease, color 150ms ease",
                cursor: "text",
                caretColor: "transparent",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
