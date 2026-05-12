import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import Upload from './pages/Upload';
import Workflows from './pages/Workflows';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="upload" element={<Upload />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
          <span className="text-2xl">⚙️</span>
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-2">Settings</h2>
        <p className="text-neutral-500">Configuration panel coming soon.</p>
      </div>
    </div>
  );
}
