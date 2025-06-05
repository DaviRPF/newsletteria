import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SubscriptionForm from './components/SubscriptionForm';
import SuccessPage from './components/SuccessPage';
import FailurePage from './components/FailurePage';
import PendingPage from './components/PendingPage';
import ProfilePage from './components/ProfilePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/subscribe" element={<SubscriptionForm />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/failure" element={<FailurePage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/profile/:phone" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;