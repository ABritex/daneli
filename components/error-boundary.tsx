import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="min-h-svh flex items-center justify-center bg-paper text-ink px-6">
                        <div className="text-center space-y-5 max-w-md">
                            <p className="text-xs tracking-[0.25em] uppercase font-mono opacity-50">
                                <span className="text-gold">$</span> error
                            </p>
                            <h2 className="text-2xl font-bold">Something went wrong</h2>
                            <p className="text-sm opacity-70 font-mono">{this.state.error?.message || "An unexpected error occurred."}</p>
                            <button
                                type="button"
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="cursor-target px-5 py-3 border border-current text-sm font-semibold hover:bg-ink hover:text-paper transition-colors"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
