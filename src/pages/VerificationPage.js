import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { updateUserStats } from "../utils/UpdateUserStats";
import {
  Bike,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  MapPin,
} from "lucide-react";

const VerificationPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(null); // używamy null na początku, żeby odróżnić ładowanie od false
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sprawdzenie, czy użytkownik ma uprawnienia administratora
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Pobierz pole "role" z profilu użytkownika
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(
            "Błąd podczas sprawdzania statusu administratora:",
            error
          );
          setIsAdmin(false);
          return;
        }

        // Sprawdź czy rola to "admin"
        setIsAdmin(data?.role === "admin");

        // Jeśli jest adminem, pobierz dojazdy
        if (data?.role === "admin") {
          fetchUnverifiedRides();
        }
      } catch (err) {
        console.error("Błąd podczas sprawdzania statusu administratora:", err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user.id]);

  // Pobierz niezweryfikowane dojazdy innych użytkowników
  const fetchUnverifiedRides = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("rides")
        .select("*, user:profiles!rides_user_id_fkey(username)")
        .eq("verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRides(data || []);
    } catch (err) {
      console.error("Błąd pobierania dojazdów do weryfikacji:", err);
      setError("Nie udało się pobrać dojazdów do weryfikacji");
    } finally {
      setLoading(false);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  // Obsługa weryfikacji dojazdu
  const handleVerify = async (rideId, isApproved) => {
    if (!isAdmin) {
      setError("Nie masz uprawnień do weryfikacji przejazdów!");
      return;
    }

    try {
      setLoading(true);

      // Pobierz dane przejazdu przed aktualizacją
      const { data: rideData } = await supabase
        .from("rides")
        .select("user_id")
        .eq("id", rideId)
        .single();

      // Aktualizuj rekord dojazdu w Supabase
      const { error } = await supabase
        .from("rides")
        .update({
          verified: isApproved,
          verified_by: user.id,
          verification_date: new Date().toISOString(),
          // Jeśli odrzucono, ustaw punkty na 0
          points: isApproved ? 10 : 0,
        })
        .eq("id", rideId);

      if (error) throw error;

      // Aktualizuj statystyki użytkownika po weryfikacji
      if (rideData?.user_id) {
        await updateUserStats(supabase, rideData.user_id);
      }

      // Aktualizuj lokalny stan
      setRides(rides.filter((ride) => ride.id !== rideId));

      // Pokaż komunikat sukcesu
      setSuccess(`Dojazd został ${isApproved ? "zatwierdzony" : "odrzucony"}`);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd weryfikacji dojazdu:", err);
      setError(`Błąd weryfikacji dojazdu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa usuwania przejazdu
  const handleDeleteRide = async (rideId) => {
    if (!isAdmin) {
      setError("Nie masz uprawnień do usuwania przejazdów!");
      return;
    }

    if (!window.confirm("Czy na pewno chcesz usunąć ten przejazd?")) {
      return;
    }

    try {
      setLoading(true);

      // Pobierz ID użytkownika dla tego przejazdu
      const { data: rideData } = await supabase
        .from("rides")
        .select("user_id")
        .eq("id", rideId)
        .single();

      // Usuń przejazd
      const { error } = await supabase.from("rides").delete().eq("id", rideId);

      if (error) throw error;

      // Aktualizuj statystyki użytkownika po usunięciu
      if (rideData?.user_id) {
        await updateUserStats(supabase, rideData.user_id);
      }

      // Aktualizuj lokalny stan
      setRides(rides.filter((ride) => ride.id !== rideId));

      // Pokaż komunikat sukcesu
      setSuccess("Przejazd został usunięty");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd usuwania przejazdu:", err);
      setError(`Błąd usuwania przejazdu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pokaż ładowanie, gdy sprawdzamy status administratora
  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-8 bg-indigo-900 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest adminem, pokaż komunikat i przycisk powrotu
  if (isAdmin === false) {
    return (
      <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
        <div className="bg-indigo-800 rounded-lg p-6 border-2 border-purple-500 text-center">
          <XCircle className="mx-auto mb-4 text-red-400" size={64} />
          <h1 className="text-2xl font-bold mb-4 text-amber-300 pixelated">
            Brak dostępu
          </h1>
          <p className="text-white mb-6">
            Nie masz uprawnień administratora do weryfikacji przejazdów.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated flex items-center mx-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            POWRÓT DO DASHBOARDU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-indigo-800 text-white p-2 rounded-full mr-3 hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white pixelated flex-grow flex items-center">
          <Bike size={24} className="mr-2 text-amber-300" />
          WERYFIKACJA DOJAZDÓW
        </h1>
        <button
          onClick={() => navigate("/ride-management")}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 pixelated text-sm"
        >
          ZARZĄDZAJ WSZYSTKIMI
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border-2 border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 border-2 border-green-700 text-green-200 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-8 text-center border-2 border-purple-500">
          <CheckCircle
            size={64}
            className="mx-auto mb-4 text-amber-300 opacity-50"
          />
          <p className="text-white mb-4 pixelated text-lg">
            Nie ma żadnych dojazdów do weryfikacji.
          </p>
          <p className="text-teal-300">
            Wszystkie przejazdy zostały zweryfikowane. Sprawdź później.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="bg-indigo-800 rounded-lg shadow-lg overflow-hidden border-2 border-purple-500"
            >
              <div className="p-4 border-b border-purple-600 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {ride.user?.username || "Użytkownik"}
                  </h2>
                  <div className="flex items-center mt-1">
                    <Calendar size={14} className="text-teal-400 mr-1" />
                    <span className="text-teal-300 text-sm">
                      {formatDate(ride.ride_date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRide(ride.id)}
                  className="text-red-400 hover:text-red-300 transition p-1"
                  title="Usuń przejazd"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {ride.photo_url && (
                <div className="relative w-full h-64">
                  <img
                    src={ride.photo_url}
                    alt="Zdjęcie weryfikacyjne"
                    className="w-full h-full object-contain bg-black"
                    onClick={() => window.open(ride.photo_url, "_blank")}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)",
                      backgroundSize: "4px 4px",
                    }}
                  ></div>
                </div>
              )}

              <div className="p-4">
                <div className="mb-4 space-y-2">
                  {ride.ride_time && (
                    <p className="text-gray-300 flex items-center">
                      <Clock className="mr-2 text-teal-400" size={16} />
                      <span className="text-white">{ride.ride_time}</span>
                    </p>
                  )}
                  {ride.location && (
                    <p className="text-gray-300 flex items-center">
                      <MapPin className="mr-2 text-teal-400" size={16} />
                      <span className="text-white">{ride.location}</span>
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerify(ride.id, true)}
                    disabled={loading}
                    className="flex-1 bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-600 pixelated flex items-center justify-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    ZATWIERDŹ
                  </button>
                  <button
                    onClick={() => handleVerify(ride.id, false)}
                    disabled={loading}
                    className="flex-1 bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-600 pixelated flex items-center justify-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    ODRZUĆ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
