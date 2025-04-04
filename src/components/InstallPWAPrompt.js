import React, { useEffect, useState } from 'react';

const InstallPWAPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Nasłuchuj zdarzenia beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Zapobiegaj automatycznemu pokazywaniu domyślnego promptu
      e.preventDefault();
      // Zapisz zdarzenie, aby móc je wywołać później
      setInstallPrompt(e);
    };

    // Nasłuchuj zdarzenia appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Sprawdź, czy aplikacja jest już zainstalowana
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Pokaż prompt instalacji
    installPrompt.prompt();
    
    // Poczekaj na odpowiedź użytkownika
    const { outcome } = await installPrompt.userChoice;
    
    // Wyczyść zapisane zdarzenie
    setInstallPrompt(null);
    
    if (outcome === 'accepted') {
      console.log('Użytkownik zaakceptował instalację PWA');
    } else {
      console.log('Użytkownik odrzucił instalację PWA');
    }
  };

  if (isInstalled || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Zainstaluj aplikację Bike Tracker</h3>
          <p className="text-sm text-gray-600">Dodaj do ekranu głównego dla łatwiejszego dostępu</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setInstallPrompt(null)} 
            className="px-3 py-1 text-gray-600 border border-gray-300 rounded"
          >
            Później
          </button>
          <button 
            onClick={handleInstallClick} 
            className="px-3 py-1 bg-primary text-white rounded"
          >
            Zainstaluj
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWAPrompt;
