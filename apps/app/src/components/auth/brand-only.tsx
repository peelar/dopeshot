"use client";

import type { ReactNode } from "react";
import { useUserTier } from "@/hooks/use-user-tier";

type BrandOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
  hideWhileLoading?: boolean;
};

export function BrandOnly({ children, fallback = null, hideWhileLoading = true }: BrandOnlyProps) {
  const { isBrandUser, isLoading } = useUserTier();

  if (isLoading && hideWhileLoading) return null;
  if (!isBrandUser) return fallback;
  return children;
}

