import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Analyzer from './pages/Analyzer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles.css';

const App = () => {
  return (
    <div className="app-shell">
      <header className="navbar card">
        <div className="brand">
          <div className="logo">RA</div>
          <div>
            <div>Resume Analyzer</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>AI-powered ATS scoring</div>
          </div>
        </div>
        <nav className="nav-links">
          <a href="/">Analyze</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </nav>
      </header>

      <div className="container">
        <div>
          <Routes>
            <Route path="/" element={<Analyzer />} />
            <Route path="/analyze" element={<Analyzer />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>

        <aside>
          <div className="card">
            <h3>Pro Tips</h3>
            <ul>
              <li>Use concise bullet points in your resume</li>
              <li>Match keywords from the job description</li>
              <li>Keep formatting simple for ATS parsing</li>
            </ul>
          </div>
        </aside>
      </div>

      <footer className="footer">done by monish</footer>
    </div>
  );
};

export default App;
