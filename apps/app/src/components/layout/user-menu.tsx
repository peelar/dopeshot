"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { signOut } from "@/lib/auth/auth-client";
import { track } from "@/lib/analytics";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun, User } from "lucide-react";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    track("user_logout_clicked");
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
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
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-8 w-8 rounded-full p-0 inline-flex items-center justify-center hover:bg-muted outline-hidden"
          aria-label={`Logged in as ${user.email}`}
          onClick={() => {
            track("user_menu_opened", { authenticated: true });
          }}
        >
          <Avatar name={user.email} size="sm" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 sm:w-56">
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
          <DropdownMenuSeparator />
          {mounted && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-medium">
                  Theme
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => {
                  setTheme(value);
                  track("theme_changed", { theme: value });
                }}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Show sign-in button when logged out
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Sign in"
      onClick={() => {
        track("user_menu_clicked", { authenticated: false });
      }}
    >
      <User className="h-4 w-4" />
    </Button>
  );
}
