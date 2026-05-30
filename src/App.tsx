import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routers } from "./router";
import { CartProvider } from "./context/CartContext";
import { SupportProvider } from "./context/SupportContext";
import { AdminProvider } from "./context/AdminContext";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;
