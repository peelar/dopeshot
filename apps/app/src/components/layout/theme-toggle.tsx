"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const themeCycle = [
  { value: "system", label: "Automatic", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = themeCycle.find((option) => option.value === theme) ?? themeCycle[0];
  const nextTheme = themeCycle[(themeCycle.indexOf(currentTheme) + 1) % themeCycle.length];
  const CurrentIcon = currentTheme.icon;

  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden="true" />;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 w-8 rounded-md p-0"
      onClick={() => setTheme(nextTheme.value)}
      aria-label={`Theme: ${currentTheme.label}. Switch to ${nextTheme.label}`}
    >
      <CurrentIcon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
