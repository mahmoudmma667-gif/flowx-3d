'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Here you could send error to monitoring service
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error!} retry={this.retry} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">
                    Something went wrong
                </h2>
                
                <p className="text-gray-400 mb-6">
                    We encountered an unexpected error. Please try again or contact support if the problem persists.
                </p>
                
                <div className="space-y-3">
                    <button
                        onClick={retry}
                        className="w-full px-4 py-3 bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
                
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 text-left">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                            Error Details (Development)
                        </summary>
                        <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs text-red-400 overflow-auto">
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

// Hook for error logging
export function useErrorHandler() {
    const handleError = (error: Error, context?: string) => {
        console.error('Error handled:', { error, context, timestamp: new Date().toISOString() });
        
        // Here you could integrate with error tracking services
        // like Sentry, LogRocket, etc.
        
        // Show user-friendly notification
        // This would use your toast system
    };

    return { handleError };
}

// Performance monitoring hook
export function usePerformance() {
    const metrics = React.useRef({
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
    });

    React.useEffect(() => {
        metrics.current.loadTime = performance.now();
        
        const handleBeforeUnload = () => {
            metrics.current.renderTime = performance.now() - metrics.current.loadTime;
            
            const perfWithMemory = performance as unknown as { memory?: { usedJSHeapSize: number } };
            if (perfWithMemory.memory) {
                metrics.current.memoryUsage = perfWithMemory.memory.usedJSHeapSize;
            }
            
            console.log('Performance metrics:', metrics.current);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return metrics;
}