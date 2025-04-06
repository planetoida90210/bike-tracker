import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AddRidePage from "./pages/AddRidePage";
import DashboardPage from "./pages/DashboardPage";
import VerificationPage from "./pages/VerificationPage";
import StatisticsPage from "./pages/StatisticsPage";
import AchievementsPage from "./pages/AchievementsPage";
import ChallengesPage from "./pages/ChallengesPage";
import UserManagementPage from "./pages/UserManagementPage";
import RideManagementPage from "./pages/RideManagementPage";
import InstallPWAPrompt from "./components/InstallPWAPrompt";
import { NotificationsProvider } from "./context/NotificationsContext";
import "./App.css";

// Easter egg inspirowany Silicon Valley
const siliconValleyQuotes = [
  "Cinek był w biurze o 8:57. My byliśmy w drodze, a Radziu jeszcze spał.",
  "Radziu twierdzi, że spóźnienie to forma artystycznego wyrazu.",
  "Ola powiedziała, że nie ma opóźnień – są tylko nienazwane godziny kreatywności na tik-toku.",
  "Cinek nie mówi, że jesteśmy spóźnieni. On tylko patrzy na zegarek i kiwa głową.",
  "Dzień, w którym Radziu przyszedł na czas, zapisaliśmy jako święto ruchome.",
  "Ja niby coś optymalizuję, ale o 9:07 optymalizuję jedynie przejazd przez korek.",
  "Raz przyszliśmy wszyscy na czas. Cinek uznał, że coś kombinujemy.",
  "Radziu mówi, że woli wejść z impetem niż punktualnie. Cinek nie śmiał się.",
  "Ola przyszła o 9:16 z kawą. Cinek już zdążył zrobić daily i ma backup plan.",
];

// Tymczasowe komponenty dla stron, które jeszcze nie zostały zaimplementowane
const Profile = () => (
  <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
    <div className="bg-indigo-800 rounded-lg p-6 border-2 border-purple-500 text-center">
      <h1 className="text-2xl font-bold mb-4 text-amber-300 pixelated">
        Profil użytkownika
      </h1>
      <p className="text-teal-300">
        Ta strona zostanie wkrótce zaimplementowana.
      </p>
      <div className="mt-6 p-4 bg-indigo-900 rounded-lg border border-purple-600">
        <p className="text-white pixelated text-sm">
          {
            siliconValleyQuotes[
              Math.floor(Math.random() * siliconValleyQuotes.length)
            ]
          }
        </p>
      </div>
    </div>
  </div>
);

const Leaderboard = () => (
  <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
    <div className="bg-indigo-800 rounded-lg p-6 border-2 border-purple-500 text-center">
      <h1 className="text-2xl font-bold mb-4 text-amber-300 pixelated">
        Pełny ranking
      </h1>
      <p className="text-teal-300">
        Ta strona zostanie wkrótce zaimplementowana.
      </p>
      <div className="mt-6 p-4 bg-indigo-900 rounded-lg border border-purple-600">
        <p className="text-white pixelated text-sm">
          {
            siliconValleyQuotes[
              Math.floor(Math.random() * siliconValleyQuotes.length)
            ]
          }
        </p>
      </div>
    </div>
  </div>
);

function App() {
  // Easter egg w konsoli
  useEffect(() => {
    console.log(
      "%c⚠️ OSTRZEŻENIE!",
      "color: red; font-size: 32px; font-weight: bold;"
    );
    console.log(
      "%cTa konsola przeglądarki jest przeznaczona dla deweloperów.",
      "font-size: 18px;"
    );
    console.log(
      "%cJeśli ktoś kazał ci coś tutaj wkleić, to prawdopodobnie próbuje uzyskać dostęp do twojego konta.",
      "font-size: 18px;"
    );
    console.log("%c", "font-size: 3px;");
    console.log(
      "%c" +
        siliconValleyQuotes[
          Math.floor(Math.random() * siliconValleyQuotes.length)
        ],
      "color: green; font-weight: bold;"
    );
  }, []);

  return (
    <AuthProvider>
      <NotificationsProvider>
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
                path="/ride-management"
                element={
                  <ProtectedRoute>
                    <RideManagementPage />
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
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
