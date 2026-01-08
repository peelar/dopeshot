"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface SidebarErrorBoundaryProps {
  children: ReactNode;
}

interface SidebarErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SidebarErrorBoundary extends Component<
  SidebarErrorBoundaryProps,
  SidebarErrorBoundaryState
> {
  constructor(props: SidebarErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SidebarErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    track("sidebar_error_boundary_triggered", {
      error: error.message,
      stack: error.stack?.substring(0, 200) || "",
    });

    console.error("Sidebar error boundary caught:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Sidebar failed to load</h3>
              <p className="text-xs text-muted-foreground">
                Try refreshing the page to restore functionality.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error details (dev only)
                </summary>
                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRefresh} size="sm" variant="outline">
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
