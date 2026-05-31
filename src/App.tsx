import { Component, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { CartProvider } from "./context/CartContext";
import { SupportProvider } from "./context/SupportContext";
import { AdminProvider } from "./context/AdminContext";
import { StoreStatusProvider } from "./context/StoreStatusContext";
import { ProductProvider } from "./context/ProductContext";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

// Top-level error boundary — prevents [object Object] crashes from surfacing
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[AppErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="text-center max-w-xs">
            <p className="text-lg font-bold text-foreground mb-1">Something went wrong</p>
            <p className="text-xs text-muted-foreground mb-4">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProductProvider>
        <StoreStatusProvider>
          <CartProvider>
            <AdminProvider>
              <SupportProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <RouterProvider router={router} />
                </TooltipProvider>
              </SupportProvider>
            </AdminProvider>
          </CartProvider>
        </StoreStatusProvider>
        </ProductProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
