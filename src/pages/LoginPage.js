import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
import bikeBackgroundImg from "../assets/bike-night-city.png"; // Taki sam import jak w HomePage

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth(); // Usunąłem loading, żeby nie blokować przycisku

  // Sprawdź, czy jest zapisana ścieżka przekierowania
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Rozpoczęcie logowania...");
      // Logowanie przez Supabase
      await signIn(email, password);
      console.log("Logowanie zakończone sukcesem");

      // Po udanym logowaniu przekieruj na dashboard lub zapisaną ścieżkę
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Błąd logowania:", err);
      setError("Błąd logowania: " + err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${bikeBackgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Przyciemnienie dla lepszej widoczności tekstu */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Efekt linii jak na starym monitorze CRT */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
          backgroundSize: "4px 4px",
        }}
      ></div>

      <div className="relative z-20 w-full max-w-md mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="text-amber-300 hover:text-amber-100 transition flex items-center"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span className="pixelated">WRÓĆ</span>
          </button>
          <h1 className="text-white text-2xl pixelated">LOGOWANIE</h1>
        </div>

        <div className="bg-indigo-900 bg-opacity-80 rounded-lg shadow-lg p-6 border-2 border-purple-400">
          {error && (
            <div className="bg-red-900 border-2 border-red-700 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-teal-300 mb-2 pixelated"
              >
                EMAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-300" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-3 py-2 bg-indigo-800 border-2 border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-teal-300 mb-2 pixelated"
              >
                HASŁO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-purple-300" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-3 py-2 bg-indigo-800 border-2 border-purple-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated"
            >
              ZALOGUJ SIĘ
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white pixelated">
              Nie masz konta?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-amber-300 hover:text-amber-100 transition pixelated"
              >
                ZAREJESTRUJ SIĘ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
