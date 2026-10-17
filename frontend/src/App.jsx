import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sponsors from './pages/Sponsors';
import Expenses from './pages/Expenses';
import Audit from './pages/Audit';
import Report from './pages/Report';

export default function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CurrencyProvider>
  );
}
