"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

interface MemoryErrorBoundaryProps {
  children: ReactNode;
}

interface MemoryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MemoryErrorBoundary extends Component<
  MemoryErrorBoundaryProps,
  MemoryErrorBoundaryState
> {
  constructor(props: MemoryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MemoryErrorBoundaryState {
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

    console.error("Memory error boundary caught:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px] p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Saved designs couldn't load</h3>
              <p className="text-xs text-muted-foreground">
                Try refreshing the page to view your saved designs.
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
