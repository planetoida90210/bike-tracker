import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddRidePage from './pages/AddRidePage';
import DashboardPage from './pages/DashboardPage';
import VerificationPage from './pages/VerificationPage';
import StatisticsPage from './pages/StatisticsPage';
import AchievementsPage from './pages/AchievementsPage';
import ChallengesPage from './pages/ChallengesPage';
import UserManagementPage from './pages/UserManagementPage';
import InstallPWAPrompt from './components/InstallPWAPrompt';
import './App.css';

// Tymczasowe komponenty dla stron, które jeszcze nie zostały zaimplementowane
const Profile = () => <div className="p-4">Profil - będzie zaimplementowany</div>;
const Leaderboard = () => <div className="p-4">Ranking - będzie zaimplementowany</div>;

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main className="container mx-auto px-4 py-4 mt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-ride" 
              element={
                <ProtectedRoute>
                  <AddRidePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verification" 
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/statistics" 
              element={
                <ProtectedRoute>
                  <StatisticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/achievements" 
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/challenges" 
              element={
                <ProtectedRoute>
                  <ChallengesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-management" 
              element={
                <ProtectedRoute>
                  <UserManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <InstallPWAPrompt />
      </div>
    </AuthProvider>
  );
}

export default App;
