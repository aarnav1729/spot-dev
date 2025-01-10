// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Ticket from './components/Ticket';
import Department from './components/Department';
import FAQs from './components/FAQ';
import Team from './components/Team';
import Priority from './components/Priority';
import Notifs from './components/Notifs';
import Dashboard from './components/Dashboard';
import STicket from './components/STicket';


function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={< LandingPage />} />
        <Route path="/login" element={< Login />} />
        <Route path="/register" element={< Register />} />
        <Route path="/profile" element={< Profile />} />
        <Route path="/department" element={ < Department />} />
        <Route path="/ticket" element={ < Ticket />} />
        <Route path="/ticket/:ticketNumber" element={<STicket />} />
        <Route path="/faqs" element={ < FAQs />} />
        <Route path="/team" element={ < Team />} />
        <Route path="/priority" element={ < Priority />} />
        <Route path="/dashboard" element={ < Dashboard />} />
        <Route path="/notifs" element={ < Notifs /> } />
      </Routes>
    </Router>
  );
}

export default App;