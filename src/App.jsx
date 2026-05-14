import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import Support from "./pages/Support";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
