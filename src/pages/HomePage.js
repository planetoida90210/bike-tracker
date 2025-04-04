import React from 'react';
import { useNavigate } from 'react-router-dom';
import InstallPWAPrompt from '../components/InstallPWAPrompt';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">Bike Tracker</h1>
          <p className="text-xl text-gray-600">Śledzenie dojazdów rowerem do pracy</p>
        </header>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Witaj w aplikacji Bike Tracker!</h2>
          <p className="mb-6 text-gray-700">
            Ta aplikacja pomoże Ci śledzić, kto częściej dojeżdża do pracy na rowerze.
            Zrób zdjęcie swojego roweru jako dowód i zbieraj punkty za każdy dojazd!
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition"
            >
              Zaloguj się
            </button>
            
            <button 
              onClick={() => navigate('/register')}
              className="w-full bg-secondary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition"
            >
              Zarejestruj się
            </button>
          </div>
        </div>
        
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-4">Dlaczego warto korzystać z Bike Tracker?</h3>
          
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h4 className="font-bold text-primary">🚲 Motywacja</h4>
            <p className="text-gray-700">Element rywalizacji zwiększa motywację do regularnych dojazdów rowerem.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h4 className="font-bold text-primary">🏆 Osiągnięcia</h4>
            <p className="text-gray-700">Zdobywaj odznaki i punkty za regularne dojazdy rowerem.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h4 className="font-bold text-primary">📊 Statystyki</h4>
            <p className="text-gray-700">Śledź swoje postępy i porównuj je z innymi uczestnikami.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h4 className="font-bold text-primary">🌍 Ekologia</h4>
            <p className="text-gray-700">Przyczyniasz się do ochrony środowiska, wybierając rower zamiast samochodu.</p>
          </div>
        </div>
      </div>
      
      <InstallPWAPrompt />
    </div>
  );
};

export default HomePage;
