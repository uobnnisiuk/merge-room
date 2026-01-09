import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TaskList } from './pages/TaskList';
import { TaskWorkspace } from './pages/TaskWorkspace';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TaskList />} />
        <Route path="/task/:id" element={<TaskWorkspace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
