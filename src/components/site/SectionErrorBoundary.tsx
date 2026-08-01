import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SectionErrorBoundary caught an isolated section error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3 font-poppins max-w-xl mx-auto my-6">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h4 className="font-display font-bold text-slate-800 text-base">
            {this.props.fallbackTitle || "Section Temporarily Unavailable"}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {this.props.fallbackMessage || "This section couldn't load right now. The rest of the page remains fully functional."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
