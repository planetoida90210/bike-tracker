import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, XCircle, RotateCw } from "lucide-react";

const CameraComponent = ({ onCapture, onCancel }) => {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [countdown, setCountdown] = useState(null);

  const switchCamera = () => {
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  const startCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            capture();
            setCountdown(null);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && onCapture) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="p-4">
      <div className="mb-4 relative overflow-hidden rounded-lg border-2 border-purple-500">
        {/* Efekt CRT/pixelowy filtr */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
            backgroundSize: "4px 4px",
          }}
        ></div>

        {/* Webcam */}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }}
          className="w-full rounded-lg"
        />

        {/* Przycisk do przełączania kamery */}
        <button
          onClick={switchCamera}
          className="absolute top-2 right-2 bg-indigo-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-indigo-700 transition"
        >
          <RotateCw size={20} />
        </button>

        {/* Wyświetlanie odliczania */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-6xl font-bold animate-pulse pixelated">
              {countdown === 0 ? "CHEESE!" : countdown}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        {countdown === null ? (
          <button
            onClick={startCountdown}
            className="bg-purple-700 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 flex items-center justify-center"
          >
            <Camera size={20} className="mr-2 text-teal-300" />
            <span className="pixelated text-sm">ZRÓB ZDJĘCIE (3s)</span>
          </button>
        ) : (
          <button
            disabled
            className="bg-gray-700 text-white py-3 px-4 rounded-lg border-2 border-gray-500 flex items-center justify-center cursor-not-allowed"
          >
            <Camera size={20} className="mr-2 text-gray-400" />
            <span className="pixelated text-sm">ODLICZANIE...</span>
          </button>
        )}

        <p className="text-sm text-teal-300 mt-2 italic text-center">
          Użyj odliczania dla lepszego rezultatu lub wybierz zdjęcie z galerii.
        </p>

        <div className="relative mt-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (onCapture && event.target?.result) {
                    onCapture(event.target.result);
                  }
                };
                reader.readAsDataURL(e.target.files[0]);
              }
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          <button className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 flex items-center justify-center">
            <Upload size={20} className="mr-2 text-amber-300" />
            <span className="pixelated text-sm">WYBIERZ ZDJĘCIE</span>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition border-2 border-red-800 flex items-center justify-center mt-3"
        >
          <XCircle size={20} className="mr-2" />
          <span className="pixelated text-sm">ANULUJ</span>
        </button>
      </div>
    </div>
  );
};

export default CameraComponent;
