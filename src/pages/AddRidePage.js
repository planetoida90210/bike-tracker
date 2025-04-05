import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
// Import useUserStats tylko jeśli jest dostępny w twoim projekcie
import { useUserStats } from "../context/UserStatsContext";
import CameraComponent from "../components/CameraComponent";
import { Bike, MapPin, ArrowLeft, Camera, X, Shield } from "lucide-react";

const AddRidePage = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Użyj hooka useUserStats (ale nie warunkowo)
  const userStats = useUserStats();
  const refreshStats = userStats ? userStats.refreshStats : null;

  // Funkcja do pobierania lokalizacji z gamingowym feedbackiem
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolokalizacja nie jest obsługiwana przez twoją przeglądarkę");
      return;
    }

    setLocation({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          status: "success",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocation({ status: "error", message: error.message });
        setError(`Nie można uzyskać lokalizacji: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Obsługa zrobienia zdjęcia
  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    // Pobierz lokalizację automatycznie po zrobieniu zdjęcia
    getLocation();
  };

  // Obsługa anulowania robienia zdjęcia
  const handleCancelCapture = () => {
    setShowCamera(false);
  };

  // Funkcja do przesyłania zdjęcia do Supabase Storage
  // Funkcja do przesyłania zdjęcia do Supabase Storage
  const uploadImage = async (imageData) => {
    try {
      setUploadProgress(10); // Start upload

      // Konwertuj base64 na blob
      const base64Data = imageData.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      setUploadProgress(30); // After blob conversion

      // Generuj unikalną nazwę pliku
      const fileName = `${Date.now()}.jpg`;
      // POPRAWIONE: Używamy katalogu "rides" zamiast ID użytkownika jako pierwszy segment ścieżki
      const filePath = `rides/${fileName}`;

      // LUB dla lepszej organizacji:
      // const filePath = `rides/${user.id}/${fileName}`;

      // Prześlij do bucketu "ride-photos"
      const { error: uploadError } = await supabase.storage
        .from("ride-photos")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          onUploadProgress: (progress) => {
            const calculatedProgress =
              30 + Math.round((progress.loaded / progress.total) * 40);
            setUploadProgress(Math.min(calculatedProgress, 70));
          },
        });

      if (uploadError) throw uploadError;

      setUploadProgress(80); // Upload complete

      // Zwróć publiczny URL zdjęcia
      const { data: publicUrlData } = supabase.storage
        .from("ride-photos")
        .getPublicUrl(filePath);

      setUploadProgress(100); // URL retrieved

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Błąd przesyłania zdjęcia:", err);
      throw err;
    }
  };

  // Obsługa wysłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!capturedImage) {
      setError("Musisz zrobić zdjęcie, aby zarejestrować dojazd");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setUploadProgress(0);

    try {
      // Prześlij zdjęcie do Supabase Storage
      const photoUrl = await uploadImage(capturedImage);

      // Dodaj rekord dojazdu do bazy danych
      const { error } = await supabase.from("rides").insert([
        {
          user_id: user.id,
          ride_date: new Date().toISOString().split("T")[0],
          ride_time: new Date().toISOString().split("T")[1].substring(0, 8),
          photo_url: photoUrl,
          location:
            location?.status === "success"
              ? `${location.latitude},${location.longitude}`
              : null,
          verified: false,
          points: 10,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Sprawdź, czy user ma już osiągnięcie "Pierwszy dojazd"
      const { data: firstRideAchievement, error: achievementError } =
        await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id)
          .eq(
            "achievement_id",
            (
              await supabase
                .from("achievements")
                .select("id")
                .eq("name", "Toj na rowerze")
                .single()
            ).data?.id
          )
          .single();

      if (!firstRideAchievement && !achievementError) {
        // Ustaw osiągnięcie do pokazania
        const { data: achievement } = await supabase
          .from("achievements")
          .select("*")
          .eq("name", "Toj na rowerze")
          .single();

        if (achievement) {
          setAchievementUnlocked(achievement);
        }
      }

      // Odśwież statystyki użytkownika, jeśli funkcja jest dostępna
      if (refreshStats) {
        await refreshStats();
      }

      setSuccess("Dojazd został pomyślnie zarejestrowany!");

      // Po 3 sekundach przekieruj na dashboard (lub gdy achievement zostanie zamknięty)
      if (!achievementUnlocked) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }
    } catch (err) {
      console.error("Error details:", err);
      setError(`Błąd podczas rejestracji dojazdu: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zamknij powiadomienie o osiągnięciu i przejdź do dashboardu
  const handleCloseAchievement = () => {
    setAchievementUnlocked(null);
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-indigo-900 bg-opacity-95">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mr-4 text-amber-300 hover:text-amber-100 transition flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span className="pixelated text-sm">WRÓĆ</span>
        </button>
        <h1 className="text-2xl font-bold text-center text-white pixelated flex items-center">
          <Bike size={24} className="mr-2 text-amber-300" />
          ZAREJESTRUJ DOJAZD
        </h1>
      </div>

      {/* Powiadomienie o osiągnięciu */}
      {achievementUnlocked && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4">
          <div className="bg-indigo-800 border-4 border-amber-400 rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{achievementUnlocked.icon}</div>
              <h3 className="text-amber-300 text-xl font-bold pixelated mb-2">
                OSIĄGNIĘCIE ODBLOKOWANE!
              </h3>
              <h4 className="text-white font-bold text-lg mb-1">
                {achievementUnlocked.name}
              </h4>
              <p className="text-teal-300 text-sm">
                {achievementUnlocked.description}
              </p>
            </div>
            <div className="flex justify-center items-center">
              <div className="bg-indigo-700 px-3 py-1 rounded-md text-amber-300 font-bold pixelated">
                +{achievementUnlocked.points} PKT
              </div>
            </div>
            <button
              onClick={handleCloseAchievement}
              className="w-full mt-4 bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 flex items-center justify-center"
            >
              <span className="pixelated">SUPER!</span>
            </button>
          </div>
        </div>
      )}

      {showCamera ? (
        <div className="bg-indigo-800 border-2 border-purple-500 rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
          <div className="p-4 border-b border-purple-500 bg-indigo-900 flex justify-between items-center">
            <h3 className="text-lg font-bold text-amber-300 pixelated">
              ZRÓB ZDJĘCIE
            </h3>
            <button
              onClick={handleCancelCapture}
              className="text-red-400 hover:text-red-300"
            >
              <X size={20} />
            </button>
          </div>
          <CameraComponent
            onCapture={handleCapture}
            onCancel={handleCancelCapture}
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-indigo-800 border-2 border-purple-500 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-purple-500 bg-indigo-900">
            <h3 className="text-xl font-bold text-amber-300 text-center pixelated">
              DODAJ PRZEJAZD
            </h3>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 m-4 rounded">
              {error}
            </div>
          )}

          {success && !achievementUnlocked && (
            <div className="bg-green-900 border border-green-500 text-green-200 px-4 py-3 m-4 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-teal-300 mb-2 pixelated text-sm flex items-center">
                <Shield size={16} className="mr-2" />
                ZDJĘCIE WERYFIKACYJNE
              </label>

              {capturedImage ? (
                <div className="mb-4 relative">
                  <img
                    src={capturedImage}
                    alt="Zdjęcie weryfikacyjne"
                    className="w-full rounded-lg border-2 border-purple-500"
                  />
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
                      backgroundSize: "4px 4px",
                    }}
                  ></div>
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-indigo-700 text-white py-3 px-4 rounded-lg hover:bg-indigo-600 transition border-2 border-purple-500 flex items-center justify-center"
                >
                  <Camera size={20} className="mr-2 text-teal-300" />
                  <span className="pixelated text-sm">ZRÓB ZDJĘCIE</span>
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-teal-300 mb-2 pixelated text-sm flex items-center">
                <MapPin size={16} className="mr-2" />
                LOKALIZACJA
              </label>

              {location?.status === "loading" ? (
                <div className="bg-indigo-700 p-4 rounded-lg border-2 border-purple-500 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-300"></div>
                </div>
              ) : location?.status === "success" ? (
                <div className="bg-indigo-700 p-4 rounded-lg border-2 border-purple-500">
                  <div className="mb-2 flex justify-between">
                    <span className="text-teal-300 text-xs">
                      LOKALIZACJA ZAPISANA
                    </span>
                    <span className="text-amber-300 text-xs">
                      DOKŁADNOŚĆ: {Math.round(location.accuracy)}m
                    </span>
                  </div>
                  <p className="text-white flex items-center mb-1 text-sm">
                    <MapPin size={16} className="mr-2 text-teal-300" />
                    <span>Szerokość: {location.latitude.toFixed(6)}</span>
                  </p>
                  <p className="text-white flex items-center text-sm">
                    <MapPin size={16} className="mr-2 text-teal-300" />
                    <span>Długość: {location.longitude.toFixed(6)}</span>
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={getLocation}
                  className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 flex items-center justify-center"
                >
                  <MapPin size={20} className="mr-2 text-amber-300" />
                  <span className="pixelated text-sm">POBIERZ LOKALIZACJĘ</span>
                </button>
              )}

              {location?.status === "error" && (
                <p className="text-red-300 text-xs mt-2">
                  Problem z GPS: {location.message}
                </p>
              )}
            </div>

            {isSubmitting && (
              <div className="mb-4">
                <div className="w-full bg-indigo-900 rounded-full h-4 border border-purple-500 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-teal-300 mt-1">
                  {uploadProgress < 100 ? "Wysyłanie..." : "Przetwarzanie..."}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !capturedImage}
              className={`w-full py-3 px-4 rounded-lg text-white border-2 flex items-center justify-center ${
                isSubmitting || !capturedImage
                  ? "bg-gray-600 border-gray-700 cursor-not-allowed"
                  : "bg-purple-700 border-purple-500 hover:bg-purple-600 transition"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="pixelated text-sm">REJESTROWANIE...</span>
                </div>
              ) : (
                <>
                  <Bike size={20} className="mr-2 text-teal-300" />
                  <span className="pixelated text-sm">ZAREJESTRUJ DOJAZD</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddRidePage;
