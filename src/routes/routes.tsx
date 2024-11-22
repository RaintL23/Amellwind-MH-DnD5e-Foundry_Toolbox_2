import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../features/home/page';
import MonstersListPage from '../features/monsters/list/page';
import Layout from '@/features/layout/layout';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/monsters/list" element={<MonstersListPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
