import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Watch } from "lucide-react";

const InstallPWAPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Cytaty o spóźnieniach zamiast techno-bełkotu
  const spateQuotes = [
    "Cinek był w biurze o 8:57. My byliśmy w drodze, a Radziu jeszcze spał.",
    "Radziu twierdzi, że spóźnienie to forma artystycznego wyrazu.",
    "Ola powiedziała, że nie ma opóźnień – są tylko nienazwane godziny kreatywności na tik-toku.",
    "Cinek nie mówi, że jesteśmy spóźnieni. On tylko patrzy na zegarek i kiwa głową.",
    "Dzień, w którym Radziu przyszedł na czas, zapisaliśmy jako święto ruchome.",
    "Ja niby coś optymalizuję, ale o 9:07 optymalizuję jedynie przejazd przez korek.",
    "Raz przyszliśmy wszyscy na czas. Cinek uznał, że coś kombinujemy.",
    "Radziu mówi, że woli wejść z impetem niż punktualnie. Cinek nie śmiał się.",
    "Ola przyszła o 9:16 z mosterkiem. Cinek już zdążył zrobić daily i ma backup plan.",
  ];

  useEffect(() => {
    // Zmieniaj cytat co 5 sekund
    if (installPrompt) {
      const interval = setInterval(() => {
        setQuoteIndex((prevIndex) => (prevIndex + 1) % spateQuotes.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [installPrompt, spateQuotes.length]);

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

      // Pokaż powiadomienie o sukcesie
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-800 text-white px-4 py-3 rounded-lg shadow-lg border-2 border-green-600 z-50 animate-bounce";
      notification.innerHTML = `
        <div class="flex items-center">
          <span class="mr-2">🚲</span>
          <span class="pixelated">No i gitówa! Zainstalowane!</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Usuń powiadomienie po 3 sekundach
      setTimeout(() => {
        notification.classList.add(
          "opacity-0",
          "transition-opacity",
          "duration-500"
        );
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Sprawdź, czy aplikacja jest już zainstalowana
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
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

    if (outcome === "accepted") {
      console.log("Użytkownik zaakceptował instalację PWA");
    } else {
      console.log("Użytkownik odrzucił instalację PWA");
      // Ukryj prompt na tydzień
      localStorage.setItem("pwaPromptDismissed", Date.now().toString());
      setIsVisible(false);
    }
  };

  const dismissPrompt = () => {
    // Zapisz timestamp w localStorage
    localStorage.setItem("pwaPromptDismissed", Date.now().toString());
    setIsVisible(false);
  };

  // Sprawdź czy prompt był już odrzucony w ciągu ostatniego tygodnia
  useEffect(() => {
    const dismissedTime = localStorage.getItem("pwaPromptDismissed");
    if (dismissedTime) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // tydzień w milisekundach
      if (Date.now() - parseInt(dismissedTime) < oneWeek) {
        setIsVisible(false);
      }
    }
  }, []);

  if (isInstalled || !installPrompt || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-indigo-900 rounded-lg shadow-lg border-2 border-purple-500 z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-teal-400 to-purple-500 animate-pulse"></div>

      <div className="px-4 py-5">
        <button
          onClick={dismissPrompt}
          className="absolute top-2 right-2 text-teal-300 hover:text-white"
          aria-label="Zamknij"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-indigo-800 border-2 border-amber-400 transform rotate-3">
              <Smartphone size={32} className="text-amber-300" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-indigo-800 border-2 border-teal-400 -z-10 transform -rotate-3">
              <Watch size={32} className="text-teal-300" />
            </div>
          </div>

          <div className="flex-grow text-center md:text-left">
            <h3 className="text-xl font-bold text-white pixelated mb-1 flex items-center justify-center md:justify-start">
              <span className="text-amber-300 mr-2">🚲</span> INSTALUJ BIKE
              TRACKER
            </h3>
            <p className="text-teal-300 text-sm mb-3 pixelated">
              Ziomek, dodaj do ekranu głównego i nie spóźnij się!
            </p>

            <div className="bg-indigo-950 rounded px-3 py-2 border border-purple-600 mb-3 min-h-[60px]">
              <p className="text-gray-300 text-xs italic">
                "{spateQuotes[quoteIndex]}"
              </p>
            </div>

            <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 justify-center md:justify-start">
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 border-2 border-indigo-700 bg-indigo-950 text-gray-300 rounded-lg pixelated text-sm hover:bg-indigo-800"
              >
                SPÓŹNIĘ SIĘ PÓŹNIEJ
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg border-2 border-purple-500 pixelated text-sm flex items-center justify-center"
              >
                <Download size={16} className="mr-1" /> ZAINSTALUJ TERAZ
              </button>
            </div>
          </div>

          <div className="hidden lg:block w-32 h-32 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pikselowy efekt */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(99, 102, 241, 0.05) 50%)",
          backgroundSize: "4px 4px",
          mixBlendMode: "overlay",
        }}
      ></div>

      {/* Easter egg */}
      <div className="absolute bottom-1 right-2 text-indigo-800 hover:text-indigo-700 text-xs">
        <span className="opacity-30">v2025.4.6_cinek_czeka</span>
      </div>
    </div>
  );
};

// Dodaj stylizację do head dokumentu tylko raz
if (
  typeof window !== "undefined" &&
  !document.getElementById("pwa-prompt-styles")
) {
  const style = document.createElement("style");
  style.id = "pwa-prompt-styles";
  document.head.appendChild(style);
}

export default InstallPWAPrompt;
