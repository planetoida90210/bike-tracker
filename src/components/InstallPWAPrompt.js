import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Joystick } from "lucide-react";

const InstallPWAPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Nasłuchuj zdarzenia beforeinstallprompt (tylko dla Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Nasłuchuj zdarzenia appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);

      // Pokaż powiadomienie o sukcesie w stylu retro
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 inset-x-4 bg-indigo-900 text-white px-4 py-3 rounded-lg shadow-lg border-2 border-purple-600 z-50";
      notification.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="mr-2">🎮</span>
            <span style="font-family: 'Press Start 2P', cursive; font-size: 0.8rem;">POZIOM ODBLOKOWANY!</span>
          </div>
          <button class="text-teal-300 hover:text-white" id="closeNotification">✕</button>
        </div>
      `;
      document.body.appendChild(notification);

      // Dodaj obsługę zamykania
      document
        .getElementById("closeNotification")
        .addEventListener("click", () => {
          notification.remove();
        });

      // Usuń powiadomienie po 4 sekundach
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.classList.add(
            "opacity-0",
            "transition-opacity",
            "duration-500"
          );
          setTimeout(() => notification.remove(), 500);
        }
      }, 4000);
    };

    // Wykryj czy jesteśmy na iOS Safari, aby dodać specjalną obsługę
    const isIOSSafari =
      /iP(ad|hone|od)/.test(navigator.userAgent) &&
      /WebKit/.test(navigator.userAgent) &&
      !/(CriOS|FxiOS|OPiOS|mercury)/.test(navigator.userAgent);

    // Dodaj specjalne metatagi dla iOS Safari
    if (isIOSSafari && typeof document !== "undefined") {
      // Ustaw viewport dla iOS
      const metaViewport = document.querySelector("meta[name=viewport]");
      if (metaViewport) {
        metaViewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1, viewport-fit=cover"
        );
      }

      // Ustaw kolor tła dla iOS status bar - INDYGO zamiast zieleni
      const metaThemeColor = document.querySelector("meta[name=theme-color]");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", "#312e81"); // indigo-900
      }

      // Dodaj meta tag dla iOS fullscreen mode
      let metaAppleMobileWebAppCapable = document.querySelector(
        "meta[name=apple-mobile-web-app-capable]"
      );
      if (!metaAppleMobileWebAppCapable) {
        metaAppleMobileWebAppCapable = document.createElement("meta");
        metaAppleMobileWebAppCapable.setAttribute(
          "name",
          "apple-mobile-web-app-capable"
        );
        metaAppleMobileWebAppCapable.setAttribute("content", "yes");
        document.head.appendChild(metaAppleMobileWebAppCapable);
      }

      // Dodaj meta tag dla iOS status bar style
      let metaAppleStatusBar = document.querySelector(
        "meta[name=apple-mobile-web-app-status-bar-style]"
      );
      if (!metaAppleStatusBar) {
        metaAppleStatusBar = document.createElement("meta");
        metaAppleStatusBar.setAttribute(
          "name",
          "apple-mobile-web-app-status-bar-style"
        );
        metaAppleStatusBar.setAttribute("content", "black-translucent");
        document.head.appendChild(metaAppleStatusBar);
      }
    }

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

  // Sprawdź czy prompt był już odrzucony w ciągu ostatniego tygodnia
  useEffect(() => {
    const dismissedTime = localStorage.getItem("pwaPromptDismissed");
    if (dismissedTime) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedTime) < oneWeek) {
        setIsVisible(false);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    // Sprawdź czy to iOS Safari
    const isIOSSafari =
      /iP(ad|hone|od)/.test(navigator.userAgent) &&
      /WebKit/.test(navigator.userAgent) &&
      !/(CriOS|FxiOS|OPiOS|mercury)/.test(navigator.userAgent);

    if (isIOSSafari) {
      // Na iOS Safari pokaż instrukcje w retro stylu
      const iosInstructions = document.createElement("div");
      iosInstructions.className =
        "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4";
      iosInstructions.innerHTML = `
        <div class="bg-indigo-900 p-5 rounded-lg shadow-lg max-w-md w-full border-2 border-purple-500">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg text-amber-300" style="font-family: 'Press Start 2P', cursive; font-size: 0.9rem;">INSTRUKCJA INSTALACJI</h3>
            <button id="closeIosInstructions" class="text-teal-300 hover:text-white text-xl">✕</button>
          </div>
          <ol class="space-y-4 text-sm mb-4 text-white">
            <li class="flex items-center">
              <span class="mr-2 text-amber-300">1.</span>
              <span>Kliknij <span class="inline-block bg-blue-500 text-white px-2 rounded">[ Udostępnij ]</span> na dole ekranu</span>
            </li>
            <li class="flex items-center">
              <span class="mr-2 text-amber-300">2.</span>
              <span>Przewiń w dół i naciśnij <span class="inline-block font-semibold text-amber-300">Dodaj do ekranu początkowego</span></span>
            </li>
            <li class="flex items-center">
              <span class="mr-2 text-amber-300">3.</span>
              <span>Kliknij <span class="inline-block bg-blue-500 text-white px-2 rounded">[ Dodaj ]</span> w prawym górnym rogu</span>
            </li>
          </ol>
          <div class="flex justify-end">
            <button id="gotItIos" class="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-md border border-purple-500" style="font-family: 'Press Start 2P', cursive; font-size: 0.7rem;">ROZUMIEM</button>
          </div>
        </div>
      `;
      document.body.appendChild(iosInstructions);

      // Obsługa zamykania instrukcji
      document
        .getElementById("closeIosInstructions")
        .addEventListener("click", () => {
          iosInstructions.remove();
        });

      document.getElementById("gotItIos").addEventListener("click", () => {
        iosInstructions.remove();
        localStorage.setItem("pwaPromptDismissed", Date.now().toString());
        setIsVisible(false);
      });

      return;
    }

    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (outcome === "accepted") {
      console.log("Użytkownik zaakceptował instalację PWA");
    } else {
      console.log("Użytkownik odrzucił instalację PWA");
      localStorage.setItem("pwaPromptDismissed", Date.now().toString());
      setIsVisible(false);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem("pwaPromptDismissed", Date.now().toString());
    setIsVisible(false);
  };

  // Nie pokazuj promptu jeśli jest już zainstalowany lub użytkownik go odrzucił
  if (
    isInstalled ||
    (!installPrompt && !/iPhone|iPad|iPod/.test(navigator.userAgent)) ||
    !isVisible
  ) {
    return null;
  }

  // Aktualna data do easter egga
  const currentDate = "2025-04-06";

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-indigo-900 rounded-lg shadow-lg border-2 border-purple-500 z-50 overflow-hidden safe-area-bottom">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-teal-400 to-purple-500 animate-pulse"></div>

      <div className="px-4 py-5">
        <button
          onClick={dismissPrompt}
          className="absolute top-2 right-2 text-teal-300 hover:text-white"
          aria-label="Zamknij"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-indigo-800 border-2 border-amber-400 transform rotate-3">
              <Smartphone size={32} className="text-amber-300" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-indigo-800 border-2 border-teal-400 -z-10 transform -rotate-3">
              <Joystick size={32} className="text-teal-300" />
            </div>
          </div>

          <div className="flex-grow text-center sm:text-left">
            <h3
              className="text-xl font-bold text-white mb-1 flex items-center justify-center sm:justify-start"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "0.9rem",
              }}
            >
              <span className="text-amber-300 mr-2">🎮</span> INSTALUJ BIKE
              TRACKER
            </h3>
            <p
              className="text-teal-300 text-sm mb-3"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "0.6rem",
              }}
            >
              DODAJ DO EKRANU GŁÓWNEGO!
            </p>

            <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 justify-center sm:justify-start">
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 border-2 border-indigo-700 bg-indigo-950 text-gray-300 rounded-lg text-sm hover:bg-indigo-800"
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: "0.6rem",
                }}
              >
                PÓŹNIEJ
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg border-2 border-purple-500 text-sm flex items-center justify-center"
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: "0.6rem",
                }}
              >
                <Download size={14} className="mr-1" /> ZAINSTALUJ
              </button>
            </div>
          </div>

          <div className="hidden lg:block w-24 h-24 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🚲</span>
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
        <span className="opacity-30">v{currentDate}_planetoida90210</span>
      </div>
    </div>
  );
};

export default InstallPWAPrompt;
