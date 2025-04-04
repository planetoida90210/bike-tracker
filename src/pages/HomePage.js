import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, BarChart2, Award, Users } from "lucide-react";
import bikeBackgroundImg from "../assets/bike-night-city.png"; // Dodaj to zdjęcie do folderu assets

const HomePage = () => {
  const navigate = useNavigate();
  const [blinkText, setBlinkText] = useState(true);

  // Efekt migania tekstu dla retro wrażenia
  useEffect(() => {
    const timer = setInterval(() => {
      setBlinkText((prev) => !prev);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative overflow-hidden"
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

      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2 pixelated">
            BIKE TRACKER
          </h1>
          <p className="text-lg text-amber-300 pixelated">
            KTO DOJEDZIE WIĘCEJ RAZY DO PRACY?
          </p>
        </div>

        <div className="w-full max-w-md bg-indigo-900 bg-opacity-80 rounded-lg shadow-lg p-6 border-2 border-purple-400">
          <div className="flex justify-center mb-8">
            <Bike size={60} className="text-amber-300" />
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated"
            >
              Zaloguj się
            </button>

            <button
              onClick={() => navigate("/register")}
              className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-600 transition border-2 border-teal-500 pixelated"
            >
              Zarejestruj się
            </button>
          </div>

          <div className="mt-10 text-center">
            <p
              className={`text-lg text-yellow-300 ${
                blinkText ? "opacity-100" : "opacity-0"
              } transition-opacity pixelated`}
            >
              NACIŚNIJ START, ABY ZACZĄĆ GRĘ
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-900 bg-opacity-70 p-4 rounded-lg text-center border-2 border-purple-400">
            <Bike className="mx-auto mb-2 text-teal-400" />
            <h3 className="font-bold text-teal-300 pixelated">
              REJESTRUJ DOJAZDY
            </h3>
          </div>

          <div className="bg-indigo-900 bg-opacity-70 p-4 rounded-lg text-center border-2 border-purple-400">
            <BarChart2 className="mx-auto mb-2 text-teal-400" />
            <h3 className="font-bold text-teal-300 pixelated">
              ŚLEDŹ STATYSTYKI
            </h3>
          </div>

          <div className="bg-indigo-900 bg-opacity-70 p-4 rounded-lg text-center border-2 border-purple-400">
            <Award className="mx-auto mb-2 text-teal-400" />
            <h3 className="font-bold text-teal-300 pixelated">
              ZDOBYWAJ ODZNAKI
            </h3>
          </div>

          <div className="bg-indigo-900 bg-opacity-70 p-4 rounded-lg text-center border-2 border-purple-400">
            <Users className="mx-auto mb-2 text-teal-400" />
            <h3 className="font-bold text-teal-300 pixelated">RYWALIZUJ</h3>
          </div>
        </div>
      </div>

      <footer className="relative z-20 w-full bg-black bg-opacity-70 py-4 text-center">
        <p className="text-gray-400 pixelated">
          &copy; 2025 BIKE TRACKER • WSZYSTKIE PRAWA ZASTRZEŻONE
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
