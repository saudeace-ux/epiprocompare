import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Details from './pages/Details';
import Report from './pages/Report';

import PriceTrends from './pages/PriceTrends';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/price-trends" element={<PriceTrends />} />
        {/* Rota dinâmica para detalhes do EPI baseada no CA */}
        <Route path="/details/:ca" element={<Details />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </HashRouter>
  );
};

export default App;