"use client";

import * as React from "react";

import { cn } from "@/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-border/70 bg-background/80 px-3 text-sm leading-4 text-foreground transition focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground/50",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";

export { Input };
