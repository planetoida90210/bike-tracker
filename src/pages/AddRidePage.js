import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import CameraComponent from "../components/CameraComponent";
import { Bike, MapPin, ArrowLeft, Camera, X } from "lucide-react";

const AddRidePage = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Funkcja do pobierania lokalizacji
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolokalizacja nie jest obsługiwana przez twoją przeglądarkę");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setError(`Nie można uzyskać lokalizacji: ${error.message}`);
      }
    );
  };

  // Obsługa zrobienia zdjęcia
  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    // Pobierz lokalizację po zrobieniu zdjęcia
    getLocation();
  };

  // Obsługa anulowania robienia zdjęcia
  const handleCancelCapture = () => {
    setShowCamera(false);
  };

  // Funkcja do przesyłania zdjęcia do Supabase Storage
  const uploadImage = async (imageData) => {
    try {
      // Konwertuj base64 na blob
      const base64Data = imageData.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      // Generuj unikalną nazwę pliku
      const fileName = `${user.id}_${Date.now()}.jpg`;
      const filePath = `ride_photos/${fileName}`;

      // Prześlij plik do Supabase Storage
      const { error } = await supabase.storage
        .from("bike-tracker")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
        });

      if (error) throw error;

      // Zwróć publiczny URL zdjęcia
      const { data: publicUrlData } = supabase.storage
        .from("bike-tracker")
        .getPublicUrl(filePath);

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
          location: location
            ? `${location.latitude},${location.longitude}`
            : null,
          verified: false,
          points: 10,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSuccess("Dojazd został pomyślnie zarejestrowany!");
      setCapturedImage(null);
      setLocation(null);

      // Po 2 sekundach przekieruj na dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(`Błąd podczas rejestracji dojazdu: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-center text-white pixelated">
          ZAREJESTRUJ DOJAZD
        </h1>
      </div>

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

          {success && (
            <div className="bg-green-900 border border-green-500 text-green-200 px-4 py-3 m-4 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-teal-300 mb-2 pixelated text-sm">
                ZDJĘCIE WERYFIKACYJNE
              </label>

              {capturedImage ? (
                <div className="mb-4 relative">
                  <img
                    src={capturedImage}
                    alt="Zdjęcie weryfikacyjne"
                    className="w-full rounded-lg border-2 border-purple-500 pixel-art"
                  />
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
              <label className="block text-teal-300 mb-2 pixelated text-sm">
                LOKALIZACJA
              </label>
              {location ? (
                <div className="bg-indigo-700 p-4 rounded-lg border-2 border-purple-500">
                  <p className="text-white flex items-center mb-1">
                    <MapPin size={16} className="mr-2 text-teal-300" />
                    <span>Szerokość: {location.latitude.toFixed(6)}</span>
                  </p>
                  <p className="text-white flex items-center">
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
            </div>

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
