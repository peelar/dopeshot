"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { User } from "lucide-react";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Show simple avatar indicator when logged in
  if (isAuthenticated && user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 rounded-full p-0 hover:bg-muted"
        aria-label={`Logged in as ${user.email}`}
        onClick={() => {
          track("user_menu_clicked", { authenticated: true });
        }}
      >
        <Avatar name={user.email} size="sm" />
      </Button>
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
