import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import DecisionCenter from './pages/DecisionCenter';
import Simulator from './pages/Simulator';
import AgentControl from './pages/AgentControl';
import Policies from './pages/Policies';
import Audit from './pages/Audit';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import ModelPerformance from './pages/ModelPerformance';

// Phase 7 — Advanced Hackathon Features
import CommandCenter from './pages/CommandCenter';
import LeakageDetection from './pages/LeakageDetection';
import StrategyComparison from './pages/StrategyComparison';
import CustomerSegments from './pages/CustomerSegments';
import KnowledgeBase from './pages/KnowledgeBase';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/decision-center" element={<DecisionCenter />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/agent-control" element={<AgentControl />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/model-performance" element={<ModelPerformance />} />
          {/* Phase 7 Routes */}
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/leakage-detection" element={<LeakageDetection />} />
          <Route path="/strategy-comparison" element={<StrategyComparison />} />
          <Route path="/customer-segments" element={<CustomerSegments />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
