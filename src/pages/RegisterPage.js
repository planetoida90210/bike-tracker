import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, KeyRound, ArrowLeft } from "lucide-react";
import bikeBackgroundImg from "../assets/bike-night-city.png"; // Dodaj to zdjęcie do folderu assets

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Walidacja
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    try {
      setIsSubmitting(true);

      // Rejestracja przez Supabase
      const result = await signUp(email, password, username);

      if (result.error) {
        throw result.error;
      }

      // Pokaż komunikat o weryfikacji emaila zamiast przekierowania
      setEmailSent(true);
    } catch (err) {
      setError("Błąd rejestracji: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${bikeBackgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Przyciemnienie dla lepszej widoczności tekstu */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Efekt linii jak na starym monitorze CRT */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
          backgroundSize: "4px 4px",
        }}
      ></div>

      <div className="max-w-md w-full relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-amber-300 hover:text-amber-100 transition"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span className="pixelated">WRÓĆ</span>
          </button>
          <h1 className="text-3xl font-bold text-white pixelated">
            REJESTRACJA
          </h1>
        </div>

        {emailSent ? (
          <div className="bg-indigo-900 bg-opacity-80 rounded-lg shadow-lg p-8 border-2 border-purple-400">
            <div className="text-center mb-6">
              <Mail size={64} className="mx-auto text-teal-300 mb-4" />
              <h2 className="text-2xl font-bold text-amber-300 pixelated mb-4">
                SPRAWDŹ SWOJĄ SKRZYNKĘ
              </h2>
              <p className="text-white mb-4">
                Link do aktywacji konta został wysłany na adres{" "}
                <span className="text-teal-300 font-medium">{email}</span>.
              </p>
              <p className="text-white mb-6">
                Kliknij link w wiadomości email, aby aktywować swoje konto i
                rozpocząć korzystanie z aplikacji.
              </p>
              <div className="p-4 bg-indigo-800 border border-purple-500 rounded-lg text-sm text-gray-300">
                <p className="mb-2 text-amber-300 pixelated">UWAGA!</p>
                <p>
                  Jeśli nie widzisz wiadomości, sprawdź folder spam lub kosz.
                </p>
                <p className="mt-2 text-xs italic">
                  Radziu przegląda spam codziennie, ale tylko pod kątem
                  ciekawych okazji. Mail od nas może się tam zgubić.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated"
            >
              PRZEJDŹ DO LOGOWANIA
            </button>
          </div>
        ) : (
          <div className="bg-indigo-900 bg-opacity-80 rounded-lg shadow-lg p-8 border-2 border-purple-400">
            {error && (
              <div className="bg-red-900 border-2 border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-teal-300 mb-2 pixelated"
                >
                  NAZWA UŻYTKOWNIKA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-purple-300" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border-2 border-purple-500 bg-indigo-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                </div>
              </div>

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
                    className="pl-10 w-full px-3 py-2 border-2 border-purple-500 bg-indigo-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
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
                    className="pl-10 w-full px-3 py-2 border-2 border-purple-500 bg-indigo-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-teal-300 mb-2 pixelated"
                >
                  POTWIERDŹ HASŁO
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-purple-300" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border-2 border-purple-500 bg-indigo-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg text-white font-bold pixelated ${
                  loading || isSubmitting
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-teal-700 hover:bg-teal-600 transition border-2 border-teal-500"
                }`}
              >
                {loading || isSubmitting
                  ? "TWORZENIE KONTA..."
                  : "ZAREJESTRUJ SIĘ"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300 pixelated">
                Masz już konto?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-amber-300 hover:text-amber-100 transition pixelated"
                >
                  ZALOGUJ SIĘ
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
