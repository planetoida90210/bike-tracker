import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import CameraComponent from "../components/CameraComponent";

const AddRidePage = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Sprawdź dostępne urządzenia
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          console.log("Dostępne kamery:", videoDevices);
          if (videoDevices.length === 0) {
            alert("Nie wykryto żadnej kamery w urządzeniu!");
          } else {
            console.log(`Wykryto ${videoDevices.length} kamer(y)`);
          }
        })
        .catch((err) => {
          console.error("Błąd podczas sprawdzania urządzeń:", err);
        });
    }
  }, []);

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
      const { data, error } = await supabase.storage
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
      const { data, error } = await supabase.from("rides").insert([
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Zarejestruj dojazd rowerem
      </h1>

      {showCamera ? (
        <CameraComponent
          onCapture={handleCapture}
          onCancel={handleCancelCapture}
        />
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                Zdjęcie weryfikacyjne
              </label>

              {capturedImage ? (
                <div className="mb-4">
                  <img
                    src={capturedImage}
                    alt="Zdjęcie weryfikacyjne"
                    className="w-full rounded-lg shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="mt-2 text-sm text-red-500"
                  >
                    Usuń zdjęcie
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition"
                >
                  Zrób zdjęcie
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Lokalizacja</label>
              {location ? (
                <div className="bg-gray-100 p-3 rounded">
                  <p>Szerokość: {location.latitude.toFixed(6)}</p>
                  <p>Długość: {location.longitude.toFixed(6)}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={getLocation}
                  className="w-full bg-secondary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition"
                >
                  Pobierz lokalizację
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !capturedImage}
              className={`w-full py-3 px-4 rounded-lg text-white ${
                isSubmitting || !capturedImage
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-success hover:bg-opacity-90 transition"
              }`}
            >
              {isSubmitting ? "Rejestrowanie..." : "Zarejestruj dojazd"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddRidePage;
