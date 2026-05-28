import { Navigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
