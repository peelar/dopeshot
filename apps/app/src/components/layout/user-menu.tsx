"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, signOutUser } from "@/lib/auth";
import { clearMemoryItemsCache } from "@/lib/storage/memory-state";
import { track } from "@/lib/analytics";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun, LogIn, MessageSquare } from "lucide-react";

interface UserMenuProps {
  onFeedbackClick?: () => void;
}

export function UserMenu({ onFeedbackClick }: UserMenuProps = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    // Clear user-specific memory cache before logout to prevent stale data on next login
    if (user?.id) {
      clearMemoryItemsCache(user.id);
    }
    const { error } = await signOutUser();
    if (error) {
      console.error("Logout failed:", error);
    }
    // Force hard reload to clear all cache and state
    // Using replace instead of href to prevent back button issues
    window.location.replace("/");
  };

  // Show skeleton while loading or not mounted to prevent layout shift and hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="h-8 w-8 rounded-full" aria-hidden="true">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  // Show dropdown menu with avatar when logged in
  if (isAuthenticated && user) {
    const themeCycle = [
      { value: "system", label: "Automatic", icon: Monitor },
      { value: "light", label: "Light", icon: Sun },
      { value: "dark", label: "Dark", icon: Moon },
    ] as const;
    const currentTheme =
      themeCycle.find((option) => option.value === theme) ?? themeCycle[0];
    const nextTheme =
      themeCycle[(themeCycle.indexOf(currentTheme) + 1) % themeCycle.length];
    const CurrentIcon = currentTheme.icon;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="group inline-flex h-8 w-8 items-center justify-center rounded-full p-0 outline-hidden transition-[box-shadow,transform] duration-150 hover:scale-[1.02] hover:shadow-sm"
          aria-label={`Logged in as ${user.email}`}
        >
          <Avatar
            name={user.email}
            size="sm"
            className="transition-[filter] duration-150 group-hover:brightness-105"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 sm:w-56">
          {/* Social links - mobile only, at very top */}
          <div className="flex items-center justify-center gap-3 px-2 py-1.5 sm:hidden">
            <a
              href="https://cal.com/adrian-pilarczyk-cs0y69/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Book a call"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
            </a>
            <a
              href="https://twitter.com/gaba6ool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Follow on Twitter"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <DropdownMenuSeparator className="sm:hidden" />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {onFeedbackClick && (
            <>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                onClick={() => {
                  onFeedbackClick();
                  track("feedback_button_clicked");
                }}
                className="sm:hidden"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          {mounted && (
            <>
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
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Show sign-in button when logged out
  return (
    <Link
      href="/auth"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Sign in"
    >
      <LogIn className="h-4 w-4" />
    </Link>
  );
}
