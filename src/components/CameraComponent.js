import React, { useState, useRef, useEffect } from "react";

const CameraComponent = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Funkcja do uruchamiania kamery
  const startCamera = async () => {
    setError("");
    setDebugInfo("Próba dostępu do kamery...");
    try {
      setDebugInfo("Sprawdzanie dostępności navigator.mediaDevices...");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Twoja przeglądarka nie obsługuje API MediaDevices");
      }

      setDebugInfo("Wywołanie getUserMedia...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setDebugInfo("Strumień uzyskany, konfiguracja video...");
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setDebugInfo("Kamera uruchomiona pomyślnie!");
    } catch (err) {
      console.error("Błąd dostępu do kamery:", err);
      setError(`Błąd dostępu do kamery: ${err.message || err}`);
      setDebugInfo(`Szczegóły błędu: ${JSON.stringify(err)}`);
    }
  };

  // Zatrzymanie kamery przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Funkcja do robienia zdjęcia
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/jpeg");
    setPhotoData(data);

    // Zatrzymaj kamerę po zrobieniu zdjęcia
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (onCapture) {
      onCapture(data);
    }
  };

  // Funkcja do wyboru zdjęcia z galerii
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target.result;
        setPhotoData(data);
        if (onCapture) {
          onCapture(data);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Funkcja do resetowania zdjęcia
  const resetPhoto = () => {
    setPhotoData(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Funkcja do otwierania wyboru pliku
  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="camera-component">
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Błąd:</strong> {error}
          </p>
          {debugInfo && (
            <details className="mt-2">
              <summary>Informacje debugowania</summary>
              <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
                {debugInfo}
              </pre>
            </details>
          )}
        </div>
      )}

      {!photoData && !stream && (
        <div className="camera-options flex flex-col space-y-4">
          <button
            onClick={startCamera}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Zrób zdjęcie aparatem
          </button>

          <button
            onClick={openFilePicker}
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Wybierz zdjęcie z galerii
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <p className="text-sm text-gray-600 mt-2">
            Uwaga: Dostęp do aparatu może nie działać na HTTP. Użyj opcji wyboru
            zdjęcia z galerii.
          </p>
        </div>
      )}

      {!photoData && stream && (
        <div className="camera-view">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <button
            onClick={capturePhoto}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Zrób zdjęcie
          </button>
        </div>
      )}

      {photoData && (
        <div className="photo-preview">
          <img
            src={photoData}
            alt="Zrobione zdjęcie"
            className="w-full rounded-lg"
          />
          <div className="flex space-x-4 mt-4">
            <button
              onClick={resetPhoto}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              Zrób ponownie
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraComponent;
