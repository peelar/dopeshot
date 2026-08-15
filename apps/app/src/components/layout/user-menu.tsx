"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { track } from "@/lib/analytics";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, MessageSquare } from "lucide-react";

interface UserMenuProps {
  onFeedbackClick?: () => void;
}

export function UserMenu({ onFeedbackClick }: UserMenuProps = {}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themeCycle = [
    { value: "system", label: "Automatic", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;
  const currentTheme = themeCycle.find((option) => option.value === theme) ?? themeCycle[0];
  const nextTheme = themeCycle[(themeCycle.indexOf(currentTheme) + 1) % themeCycle.length];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0 outline-hidden transition-[box-shadow,transform] duration-150 hover:scale-[1.02] hover:shadow-sm"
        aria-label="Open menu"
      >
        <Avatar
          name="dopeshot"
          size="sm"
          className="transition-[filter,border-color] duration-150 group-hover:brightness-105 group-hover:border-transparent"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 sm:w-56">
        {onFeedbackClick ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                onFeedbackClick();
                track("feedback_button_clicked");
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {mounted ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => {
                setTheme(nextTheme.value);
              }}
            >
              <CurrentIcon className="mr-2 h-4 w-4" />
              Theme
              <span className="ml-auto text-xs tracking-normal text-muted-foreground">
                {currentTheme.label}
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
