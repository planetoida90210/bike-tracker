import React, { useRef } from "react";

const CameraComponent = ({ onCapture }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (onCapture) {
          onCapture(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-4">Dodaj zdjęcie</h3>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Wybierz zdjęcie z galerii, które pokazuje Twój rower przy miejscu
          pracy.
        </p>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
};

export default CameraComponent;
