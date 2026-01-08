"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface PlaygroundErrorBoundaryProps {
  children: ReactNode;
}

interface PlaygroundErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PlaygroundErrorBoundary extends Component<
  PlaygroundErrorBoundaryProps,
  PlaygroundErrorBoundaryState
> {
  constructor(props: PlaygroundErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PlaygroundErrorBoundaryState {
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

    track("playground_error_boundary_triggered", {
      error: error.message,
      stack: error.stack?.substring(0, 200) || "",
    });

    console.error("Playground error boundary caught:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Something went wrong with the editor</h2>
              <p className="text-sm text-muted-foreground">
                The playground encountered an unexpected error. Try refreshing the page to continue.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error details (dev only)
                </summary>
                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRefresh} size="sm">
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
