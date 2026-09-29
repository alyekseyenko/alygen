import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import App from './App';
import Tester from './pages/Tester';
import Followups from './pages/Followups';
import Dashboard from './pages/Dashboard';
import Automation from './pages/Automation';
import Templates from './pages/Templates';
import Meetings from './pages/Meetings';
import Pipeline from './pages/Pipeline';
import TestsPage from './pages/TestsPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import Prospector from './pages/Prospector';

function AppShell({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function Router() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppShell><App /></AppShell>} />
          <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
          <Route path="/followups" element={<AppShell><Followups /></AppShell>} />
          <Route path="/tester" element={<AppShell><Tester /></AppShell>} />
          <Route path="/automacao" element={<AppShell><Automation /></AppShell>} />
          <Route path="/templates" element={<AppShell><Templates /></AppShell>} />
          <Route path="/agenda" element={<AppShell><Meetings /></AppShell>} />
          <Route path="/funil" element={<AppShell><Pipeline /></AppShell>} />
          <Route path="/mapa" element={<AppShell><MapPage /></AppShell>} />
          <Route path="/automation" element={<AppShell><Automation /></AppShell>} />
          <Route path="/tests" element={<AppShell><TestsPage /></AppShell>} />
          <Route path="/report/:website" element={<AppShell><ReportPage /></AppShell>} />
          <Route path="/prospector" element={<AppShell><Prospector /></AppShell>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
