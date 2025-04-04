import React, { useRef, useCallback } from "react";
import Webcam from "react-webcam";

const CameraComponent = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (onCapture) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Zrób zdjęcie</h3>

      <div className="flex flex-col gap-4">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
          }}
          className="w-full rounded"
        />

        <button
          onClick={capture}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Zrób zdjęcie
        </button>

        <p className="text-sm text-gray-600 mt-2">
          Jeśli aparat nie działa, spróbuj wdrożyć aplikację na Vercelu lub użyj
          opcji wyboru zdjęcia poniżej.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (onCapture) {
                  onCapture(event.target.result);
                }
              };
              reader.readAsDataURL(e.target.files[0]);
            }
          }}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
};

export default CameraComponent;
