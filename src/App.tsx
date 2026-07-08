import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Companies from "./pages/Companies";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import { Spinner } from "./components/ui";

function Gate() {
  const { ready, email, requiresAuth } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Shared mode requires a signed-in user; demo mode does not.
  if (requiresAuth && !email) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
