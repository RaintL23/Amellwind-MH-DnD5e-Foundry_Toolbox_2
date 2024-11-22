// src/routes.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../features/home/page';
import MonstersListPage from '../features/monsters/list/page';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/monsters/list" element={<MonstersListPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
