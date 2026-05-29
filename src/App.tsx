import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { AdminProvider } from "@/contexts/AdminContext";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

function AppLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading app…</p>
      </div>
    </div>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<AppLoading />}>
              <RouterProvider router={router} />
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
};

export default App;
