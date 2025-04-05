import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { updateUserStats } from "../utils/UpdateUserStats";
import {
  Bike,
  Trophy,
  BarChart2,
  Calendar,
  CheckCircle,
  Plus,
  Medal,
  Clock,
  User,
} from "lucide-react";

const DashboardPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topRiders, setTopRiders] = useState([]);
  const [userStats, setUserStats] = useState({
    totalRides: 0,
    totalPoints: 0,
    thisMonth: 0,
    verified: 0,
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Pobierz dojazdy użytkownika i topowych użytkowników
    const fetchData = async () => {
      try {
        setLoading(true);

        // Najpierw aktualizujemy statystyki użytkownika, aby mieć pewność, że są zgodne z rzeczywistością
        await updateUserStats(supabase, user.id);

        // Pobierz dojazdy z Supabase
        const { data: ridesData, error: ridesError } = await supabase
          .from("rides")
          .select("*")
          .eq("user_id", user.id)
          .order("ride_date", { ascending: false });

        if (ridesError) throw ridesError;

        // Pobierz topowych użytkowników
        const { data: topUsers, error: topUsersError } = await supabase
          .from("profiles")
          .select("id, username, total_rides, total_points")
          .order("total_points", { ascending: false })
          .limit(3);

        if (topUsersError) throw topUsersError;

        // Ustaw dane
        setRides(ridesData || []);
        setTopRiders(topUsers || []);

        // Obliczanie statystyk z pobranych przejazdów
        const thisMonth = ridesData.filter((ride) => {
          const rideDate = new Date(ride.ride_date);
          const now = new Date();
          return (
            rideDate.getMonth() === now.getMonth() &&
            rideDate.getFullYear() === now.getFullYear()
          );
        }).length;

        const verified = ridesData.filter((ride) => ride.verified).length;

        // Pobierz aktualne statystyki z profilu
        const { data: profileData } = await supabase
          .from("profiles")
          .select("total_rides, total_points")
          .eq("id", user.id)
          .single();

        // Ustaw statystyki na podstawie danych z profilu (zsynchronizowane)
        setUserStats({
          totalRides: profileData?.total_rides || 0,
          totalPoints: profileData?.total_points || 0,
          thisMonth,
          verified,
        });
      } catch (err) {
        console.error("Błąd pobierania dojazdów:", err);
        setError("Nie udało się pobrać danych");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Nasłuchuj na zmiany w tabeli rides
    const ridesSubscription = supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Po każdej zmianie w tabeli rides, aktualizuj statystyki
          await updateUserStats(supabase, user.id);
          // Ponownie pobierz dane
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesSubscription);
    };
  }, [user.id]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white pixelated flex items-center">
          <Bike size={24} className="mr-2 text-amber-300" />
          DASHBOARD
        </h1>
        <button
          onClick={() => navigate("/add-ride")}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 flex items-center"
        >
          <Plus size={18} className="mr-1" />
          <span className="pixelated text-sm">DODAJ DOJAZD</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
            <BarChart2 size={20} className="mr-2" />
            TWOJE STATYSTYKI
          </h2>
          {/* Poprawiony grid dla statystyk - lepiej działa na mobile */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="DOJAZDY"
              value={userStats.totalRides}
              icon={<Bike className="text-cyan-400" />}
            />
            <StatCard
              title="PUNKTY"
              value={userStats.totalPoints}
              icon={<Trophy className="text-amber-300" />}
            />
            <StatCard
              title="W MIESIĄCU"
              value={userStats.thisMonth}
              icon={<Calendar className="text-teal-400" />}
            />
            <StatCard
              title="ZWERYFIKOWANE"
              value={userStats.verified}
              icon={<CheckCircle className="text-green-400" />}
            />
          </div>

          <button
            onClick={() => navigate("/statistics")}
            className="w-full mt-4 bg-teal-700 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 pixelated text-sm flex items-center justify-center"
          >
            <BarChart2 size={16} className="mr-2" />
            SZCZEGÓŁOWE STATYSTYKI
          </button>
        </div>

        <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
            <Trophy size={20} className="mr-2" />
            RANKING
          </h2>

          {topRiders.length > 0 ? (
            <div className="space-y-3">
              {topRiders.map((rider, index) => (
                <div
                  key={rider.id}
                  className={`flex items-center p-3 rounded-lg border ${
                    rider.id === user.id
                      ? "bg-green-900 bg-opacity-30 border-green-700"
                      : "bg-indigo-900 bg-opacity-50 border-purple-700"
                  }`}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white rounded-full mr-3"
                    style={{
                      backgroundColor:
                        index === 0
                          ? "#FFD700"
                          : index === 1
                          ? "#C0C0C0"
                          : "#CD7F32",
                      border: "2px solid",
                      borderColor:
                        index === 0
                          ? "#FFA000"
                          : index === 1
                          ? "#919191"
                          : "#A05A2C",
                    }}
                  >
                    <span className="pixelated font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-white pixelated text-sm flex items-center">
                      <User size={14} className="mr-1" />
                      {rider.username}
                    </p>
                    <p className="text-xs text-teal-300">
                      {rider.total_rides || 0} dojazdów
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-300 pixelated">
                      {rider.total_points || 0} PKT
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Trophy
                size={48}
                className="mx-auto mb-4 text-amber-300 opacity-50"
              />
              <p className="text-white pixelated text-sm">
                Ranking będzie dostępny wkrótce
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/leaderboard")}
            className="w-full mt-4 bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated text-sm flex items-center justify-center"
          >
            <Trophy size={16} className="mr-2" />
            ZOBACZ PEŁNY RANKING
          </button>
        </div>
      </div>

      <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
        <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
          <Bike size={20} className="mr-2" />
          HISTORIA DOJAZDÓW
        </h2>

        {error && (
          <div className="bg-red-900 border-2 border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-8 bg-indigo-900 bg-opacity-50 rounded-lg border border-purple-700">
            <Bike
              size={64}
              className="mx-auto mb-4 text-amber-300 opacity-50"
            />
            <p className="text-white mb-4 pixelated text-sm">
              Nie masz jeszcze żadnych zarejestrowanych dojazdów.
            </p>
            <button
              onClick={() => navigate("/add-ride")}
              className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated text-sm"
            >
              DODAJ PIERWSZY DOJAZD
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-700 border-collapse">
              <thead className="bg-indigo-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Zdjęcie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Punkty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-indigo-900 bg-opacity-50 divide-y divide-purple-700">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-indigo-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-teal-400" />
                        <span className="text-white">
                          {formatDate(ride.ride_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.photo_url ? (
                        <div className="relative w-16 h-16 overflow-hidden rounded border-2 border-purple-500">
                          {/* Naprawione wyświetlanie zdjęć */}
                          <img
                            src={ride.photo_url}
                            alt="Zdjęcie weryfikacyjne"
                            className="h-full w-full object-cover cursor-pointer absolute inset-0"
                            onClick={() =>
                              window.open(ride.photo_url, "_blank")
                            }
                          />
                          {/* Nakładka pikselowa */}
                          <div
                            className="absolute inset-0 pointer-events-none border-2 border-purple-500 rounded"
                            style={{
                              backgroundImage:
                                "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)",
                              backgroundSize: "4px 4px",
                            }}
                          ></div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Brak zdjęcia</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300 border border-green-700 pixelated">
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
                  </tr>
                ))}
              </tbody>
            </table>
            {rides.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => navigate("/all-rides")}
                  className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 pixelated text-sm"
                >
                  ZOBACZ WSZYSTKIE DOJAZDY
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Komponent karty statystyk - poprawiony, by lepiej wyglądał na mobile
const StatCard = ({ title, value, icon }) => (
  <div className="bg-indigo-900 bg-opacity-50 p-2 sm:p-4 rounded-lg text-center border border-purple-700 flex flex-col items-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <p className="text-2xl sm:text-3xl font-bold text-amber-300">{value}</p>
    <p className="text-teal-300 pixelated text-xs mt-1 truncate w-full">
      {title}
    </p>
  </div>
);

export default DashboardPage;
