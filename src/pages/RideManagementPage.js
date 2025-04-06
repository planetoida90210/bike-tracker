import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { updateUserStats } from "../utils/UpdateUserStats";
import {
  Bike,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Medal,
  User,
  Clock,
  Filter,
  ArrowLeft,
  Eye,
} from "lucide-react";

const RideManagementPage = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAdmin, setIsAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'verified', 'pending'
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sprawdzenie, czy użytkownik ma uprawnienia administratora
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setIsAdmin(data?.role === "admin");
      } catch (err) {
        console.error("Błąd podczas sprawdzania statusu administratora:", err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user.id]);

  useEffect(() => {
    // Pobierz wszystkie dojazdy (dla admina)
    const fetchAllRides = async () => {
      if (isAdmin === null || isAdmin === false) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("rides")
          .select("*, user:profiles!rides_user_id_fkey(id, username)")
          .order("ride_date", { ascending: false });

        if (error) throw error;

        setRides(data || []);
        setFilteredRides(data || []);
      } catch (err) {
        console.error("Błąd pobierania dojazdów:", err);
        setError("Nie udało się pobrać dojazdów");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRides();
  }, [isAdmin]);

  useEffect(() => {
    // Filtrowanie przejazdów na podstawie wyszukiwania i statusu
    let results = [...rides];

    // Filtrowanie po statusie
    if (filterStatus === "verified") {
      results = results.filter((ride) => ride.verified);
    } else if (filterStatus === "pending") {
      results = results.filter((ride) => !ride.verified);
    }

    // Filtrowanie po wyszukiwanym terminie
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (ride) =>
          (ride.user?.username &&
            ride.user.username.toLowerCase().includes(term)) ||
          new Date(ride.ride_date).toLocaleDateString("pl-PL").includes(term) ||
          (ride.location && ride.location.toLowerCase().includes(term))
      );
    }

    setFilteredRides(results);
  }, [searchTerm, filterStatus, rides]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  // Obsługa usuwania przejazdu
  const handleDeleteRide = async (rideId, userId) => {
    if (!isAdmin) {
      setError("Nie masz uprawnień do usuwania przejazdów!");
      return;
    }

    if (!window.confirm("Czy na pewno chcesz usunąć ten przejazd?")) {
      return;
    }

    try {
      setLoading(true);

      // Usuń przejazd
      const { error } = await supabase.from("rides").delete().eq("id", rideId);

      if (error) throw error;

      // Aktualizuj statystyki użytkownika po usunięciu
      if (userId) {
        await updateUserStats(supabase, userId);
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

  // Obsługa weryfikacji dojazdu
  const handleVerify = async (rideId, userId, isApproved) => {
    if (!isAdmin) {
      setError("Nie masz uprawnień do weryfikacji przejazdów!");
      return;
    }

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

      // Aktualizuj statystyki użytkownika po weryfikacji
      if (userId) {
        await updateUserStats(supabase, userId);
      }

      // Aktualizuj lokalny stan
      setRides(
        rides.map((ride) =>
          ride.id === rideId
            ? { ...ride, verified: isApproved, points: isApproved ? 10 : 0 }
            : ride
        )
      );

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

  // Pokaż ładowanie, gdy sprawdzamy status administratora
  if (isAdmin === null) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest adminem, przekieruj go do dashboardu
  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-800 text-white p-2 rounded-full mr-3 hover:bg-indigo-700 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white pixelated flex-grow">
          Zarządzanie przejazdami (Admin)
        </h1>
      </div>

      {error && (
        <div className="bg-red-900 border-2 border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 border-2 border-green-700 text-green-100 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po nazwie użytkownika, dacie..."
              className="block w-full pl-10 pr-3 py-2 border-2 border-purple-600 bg-indigo-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-2 border-purple-600 bg-indigo-900 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="all">Wszystkie</option>
              <option value="verified">Zweryfikowane</option>
              <option value="pending">Oczekujące</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-8 text-center border-2 border-purple-500">
          <div className="text-amber-300 mb-3">
            <Bike size={64} className="mx-auto opacity-50" />
          </div>
          <p className="text-white pixelated text-xl mb-2">
            Brak dojazdów spełniających kryteria
          </p>
          <p className="text-gray-300">
            Zmień kryteria wyszukiwania, aby zobaczyć przejazdy
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-700 border-collapse bg-indigo-800 rounded-lg shadow-lg">
              <thead className="bg-indigo-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Punkty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Zdjęcie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-indigo-800 divide-y divide-purple-700">
                {filteredRides.map((ride) => (
                  <tr
                    key={ride.id}
                    className={`hover:bg-indigo-700 ${
                      !ride.verified ? "bg-yellow-900 bg-opacity-20" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={16} className="mr-2 text-cyan-400" />
                        <span className="text-white font-medium">
                          {ride.user?.username || "Nieznany"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-teal-400" />
                        <span className="text-white">
                          {formatDate(ride.ride_date)}
                          {ride.ride_time && ` - ${ride.ride_time}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300 border border-green-700 pixelated flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          ZWERYFIKOWANY
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900 text-yellow-300 border border-yellow-700 pixelated flex items-center">
                          <Clock size={12} className="mr-1" />
                          OCZEKUJE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Medal size={16} className="mr-2 text-amber-300" />
                        <span className="text-amber-300 font-bold">
                          {ride.points || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.photo_url ? (
                        <button
                          onClick={() => window.open(ride.photo_url, "_blank")}
                          className="bg-indigo-700 p-2 rounded-lg hover:bg-indigo-600 transition"
                        >
                          <Eye size={16} className="text-teal-300" />
                        </button>
                      ) : (
                        <span className="text-gray-500">Brak zdjęcia</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!ride.verified && (
                          <>
                            <button
                              onClick={() =>
                                handleVerify(ride.id, ride.user_id, true)
                              }
                              className="bg-green-700 p-2 rounded-lg hover:bg-green-600 transition"
                              title="Zatwierdź"
                            >
                              <CheckCircle
                                size={16}
                                className="text-green-300"
                              />
                            </button>
                            <button
                              onClick={() =>
                                handleVerify(ride.id, ride.user_id, false)
                              }
                              className="bg-orange-700 p-2 rounded-lg hover:bg-orange-600 transition"
                              title="Odrzuć"
                            >
                              <XCircle size={16} className="text-orange-300" />
                            </button>
                          </>
                        )}
                        {ride.verified && (
                          <button
                            onClick={() =>
                              handleVerify(ride.id, ride.user_id, false)
                            }
                            className="bg-orange-700 p-2 rounded-lg hover:bg-orange-600 transition"
                            title="Cofnij weryfikację"
                          >
                            <XCircle size={16} className="text-orange-300" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteRide(ride.id, ride.user_id)
                          }
                          className="bg-red-700 p-2 rounded-lg hover:bg-red-600 transition"
                          title="Usuń przejazd"
                        >
                          <Trash2 size={16} className="text-red-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideManagementPage;
