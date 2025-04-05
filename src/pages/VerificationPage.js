import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";

const VerificationPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    // Pobierz niezweryfikowane dojazdy innych użytkowników
    const fetchUnverifiedRides = async () => {
      try {
        setLoading(true);

        // Pobierz dojazdy z Supabase, które nie są zweryfikowane i nie należą do bieżącego użytkownika
        // Używamy jawnie określonej relacji z foreign.key
        const { data, error } = await supabase
          .from("rides")
          .select("*, user:profiles!rides_user_id_fkey(username)")
          .eq("verified", false)
          .neq("user_id", user.id)
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

    fetchUnverifiedRides();
  }, [user.id]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  // Obsługa weryfikacji dojazdu
  const handleVerify = async (rideId, isApproved) => {
    try {
      setLoading(true);

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

      // Aktualizuj lokalny stan
      setRides(rides.filter((ride) => ride.id !== rideId));

      // Pokaż komunikat sukcesu
      setSuccess(`Dojazd został ${isApproved ? "zatwierdzony" : "odrzucony"}`);

      // Wyczyść komunikat sukcesu po 3 sekundach
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Weryfikacja dojazdów</h1>

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

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">
            Nie ma żadnych dojazdów do weryfikacji.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    {ride.user?.username || "Użytkownik"}
                  </h2>
                  <span className="text-gray-500 text-sm">
                    {formatDate(ride.ride_date)}
                  </span>
                </div>
              </div>

              {ride.photo_url && (
                <div className="relative">
                  <img
                    src={ride.photo_url}
                    alt="Zdjęcie weryfikacyjne"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                <div className="mb-4">
                  <p className="text-gray-600">
                    <strong>Godzina:</strong> {ride.ride_time}
                  </p>
                  {ride.location && (
                    <p className="text-gray-600">
                      <strong>Lokalizacja:</strong> {ride.location}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerify(ride.id, true)}
                    disabled={loading}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zatwierdź
                  </button>
                  <button
                    onClick={() => handleVerify(ride.id, false)}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Odrzuć
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
