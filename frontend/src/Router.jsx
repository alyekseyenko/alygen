import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import App from './App'
import Tester from './pages/Tester'
import Followups from './pages/Followups'
import Dashboard from './pages/Dashboard'
import Automation from './pages/Automation'
import Templates from './pages/Templates'
import Meetings from './pages/Meetings'
import Pipeline from './pages/Pipeline'
import TestsPage from './pages/TestsPage'
import MapPage from './pages/MapPage'
import ReportPage from './pages/ReportPage'

export default function Router() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/tester" element={<Tester />} />
          <Route path="/automacao" element={<Automation />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/agenda" element={<Meetings />} />
          <Route path="/funil" element={<Pipeline />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/report/:website" element={<ReportPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
