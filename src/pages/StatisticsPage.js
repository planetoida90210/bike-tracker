import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  BarChart2,
  Bike,
  Award,
  Trophy,
  Flame,
  CheckCircle,
  ArrowLeft,
  Medal,
  Users,
  Calendar,
} from "lucide-react";

// Komponent do wyświetlania wykresu aktywności
const ActivityChart = ({ data, title, icon }) => {
  // Uproszczona implementacja wykresu jako kolorowe paski
  const maxValue = Math.max(...data.map((d) => d.count)) || 1;

  return (
    <div className="mt-4">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="font-bold text-teal-300 pixelated text-sm ml-2">
          {title}
        </h3>
      </div>
      <div className="flex items-end h-32 space-x-1 bg-indigo-900 bg-opacity-50 p-2 border border-purple-700 rounded-lg">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center flex-1 space-y-1"
          >
            <div
              className="w-full bg-cyan-500 hover:bg-cyan-400 transition rounded-t-sm relative group"
              style={{
                height: `${(item.count / maxValue) * 100}%`,
                minHeight: item.count > 0 ? "8px" : "0",
              }}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-indigo-800 text-amber-300 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 text-xs border border-purple-500">
                {item.count} dojazdów
              </div>
            </div>
            <div
              className="text-xs text-teal-300 pixelated"
              style={{ fontSize: "0.6rem" }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatisticsPage = () => {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalPoints: 0,
    thisMonthRides: 0,
    thisWeekRides: 0,
    verifiedRides: 0,
    streakDays: 0,
    weeklyData: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        // Pobierz dojazdy użytkownika
        const { data: rides, error } = await supabase
          .from("rides")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        // Pobierz ranking użytkowników
        const { data: leaderboardData, error: leaderboardError } =
          await supabase
            .from("profiles")
            .select("id, username, total_rides, total_points")
            .order("total_points", { ascending: false })
            .limit(5);

        if (leaderboardError) throw leaderboardError;

        // Oblicz statystyki
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Dojazdy w tym miesiącu
        const thisMonthRides = rides.filter((ride) => {
          const rideDate = new Date(ride.ride_date);
          return (
            rideDate.getMonth() === thisMonth &&
            rideDate.getFullYear() === thisYear
          );
        }).length;

        // Dojazdy w tym tygodniu
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekRides = rides.filter((ride) => {
          const rideDate = new Date(ride.ride_date);
          return rideDate >= startOfWeek;
        }).length;

        // Zweryfikowane dojazdy
        const verifiedRides = rides.filter((ride) => ride.verified).length;

        // Suma punktów
        const totalPoints = rides.reduce(
          (sum, ride) => sum + (ride.points || 0),
          0
        );

        // Dane tygodniowe (ostatnie 7 dni)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);

          const count = rides.filter((ride) => {
            const rideDate = new Date(ride.ride_date);
            return rideDate >= date && rideDate < nextDate;
          }).length;

          const dayNames = ["ND", "PN", "WT", "ŚR", "CZ", "PT", "SB"];
          weeklyData.push({
            label: dayNames[date.getDay()],
            count,
          });
        }

        // Dane miesięczne (ostatnie 6 miesięcy)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);

          const month = date.getMonth();
          const year = date.getFullYear();

          const count = rides.filter((ride) => {
            const rideDate = new Date(ride.ride_date);
            return (
              rideDate.getMonth() === month && rideDate.getFullYear() === year
            );
          }).length;

          const monthNames = [
            "STY",
            "LUT",
            "MAR",
            "KWI",
            "MAJ",
            "CZE",
            "LIP",
            "SIE",
            "WRZ",
            "PAŹ",
            "LIS",
            "GRU",
          ];
          monthlyData.push({
            label: monthNames[month],
            count,
          });
        }

        // Oblicz aktualną serię dni
        let streakDays = 0;
        const sortedDates = rides
          .map((ride) => ride.ride_date)
          .sort((a, b) => new Date(b) - new Date(a)); // Sortuj od najnowszych

        if (sortedDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          // Sprawdź, czy jest dojazd dzisiaj lub wczoraj
          const latestRideDate = new Date(sortedDates[0]);
          latestRideDate.setHours(0, 0, 0, 0);

          if (
            latestRideDate.getTime() === today.getTime() ||
            latestRideDate.getTime() === yesterday.getTime()
          ) {
            streakDays = 1;

            // Sprawdź poprzednie dni
            let checkDate = new Date(latestRideDate);
            checkDate.setDate(checkDate.getDate() - 1);

            for (let i = 1; i < sortedDates.length; i++) {
              const rideDate = new Date(sortedDates[i]);
              rideDate.setHours(0, 0, 0, 0);

              if (rideDate.getTime() === checkDate.getTime()) {
                streakDays++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
          }
        }

        setStats({
          totalRides: rides.length,
          totalPoints,
          thisMonthRides,
          thisWeekRides,
          verifiedRides,
          streakDays,
          weeklyData,
          monthlyData,
        });

        setLeaderboard(leaderboardData || []);
      } catch (err) {
        console.error("Błąd pobierania statystyk:", err);
        setError("Nie udało się pobrać statystyk");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user.id]);

  return (
    <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="mr-4 text-amber-300 hover:text-amber-100 transition flex items-center"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span className="pixelated text-sm">WRÓĆ</span>
          </button>
          <h1 className="text-2xl font-bold text-white pixelated flex items-center">
            <BarChart2 size={24} className="mr-2 text-amber-300" />
            STATYSTYKI
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border-2 border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
            <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
              <Trophy size={20} className="mr-2" />
              TWOJE STATYSTYKI
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard
                title="DOJAZDY"
                value={stats.totalRides}
                icon={<Bike size={20} className="text-cyan-400" />}
              />
              <StatCard
                title="PUNKTY"
                value={stats.totalPoints}
                icon={<Award size={20} className="text-amber-300" />}
              />
              <StatCard
                title="W TYM TYGODNIU"
                value={stats.thisWeekRides}
                icon={<Calendar size={20} className="text-teal-400" />}
              />
              <StatCard
                title="W TYM MIESIĄCU"
                value={stats.thisMonthRides}
                icon={<Calendar size={20} className="text-teal-400" />}
              />
              <StatCard
                title="SERIA DNI"
                value={stats.streakDays}
                icon={<Flame size={20} className="text-red-400" />}
              />
              <StatCard
                title="ZWERYFIKOWANE"
                value={stats.verifiedRides}
                icon={<CheckCircle size={20} className="text-green-400" />}
              />
            </div>

            <ActivityChart
              data={stats.weeklyData}
              title="AKTYWNOŚĆ W TYM TYGODNIU"
              icon={<Calendar size={16} className="text-teal-300" />}
            />

            <ActivityChart
              data={stats.monthlyData}
              title="AKTYWNOŚĆ MIESIĘCZNA"
              icon={<Calendar size={16} className="text-teal-300" />}
            />
          </div>

          <div>
            <div className="bg-indigo-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-500">
              <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
                <Users size={20} className="mr-2" />
                RANKING
              </h2>
              {leaderboard.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy
                    size={48}
                    className="mx-auto mb-4 text-amber-300 opacity-50"
                  />
                  <p className="text-white pixelated">
                    Brak danych do wyświetlenia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center p-3 rounded-lg border ${
                        item.id === user.id
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
                              : index === 2
                              ? "#CD7F32"
                              : "#4338CA",
                          border: "2px solid",
                          borderColor:
                            index === 0
                              ? "#FFA000"
                              : index === 1
                              ? "#919191"
                              : index === 2
                              ? "#A05A2C"
                              : "#312E81",
                        }}
                      >
                        <span className="pixelated font-bold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-white pixelated text-sm">
                          {item.username}
                        </p>
                        <p className="text-xs text-teal-300 flex items-center">
                          <Bike size={12} className="mr-1" />
                          {item.total_rides || 0} dojazdów
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-300 pixelated">
                          {item.total_points || 0} PKT
                        </p>
                        {index === 0 && (
                          <span className="inline-block text-xs bg-amber-800 text-amber-300 px-2 py-0.5 rounded-full border border-amber-600 pixelated">
                            LIDER
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate("/leaderboard")}
                className="w-full mt-4 bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated text-sm flex items-center justify-center"
              >
                <Users size={16} className="mr-2" />
                PEŁNY RANKING
              </button>
            </div>

            <div className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
              <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
                <Medal size={20} className="mr-2" />
                OSIĄGNIĘCIA
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <AchievementCard
                  title="POCZĄTKUJĄCY"
                  description="5 dojazdów"
                  icon="🚲"
                  unlocked={stats.totalRides >= 5}
                />
                <AchievementCard
                  title="OGIEŃ"
                  description="5 dni z rzędu"
                  icon="🔥"
                  unlocked={stats.streakDays >= 5}
                />
                <AchievementCard
                  title="MISTRZ"
                  description="50 dojazdów"
                  icon="🏆"
                  unlocked={stats.totalRides >= 50}
                />
                <AchievementCard
                  title="EKOLOG"
                  description="100 dojazdów"
                  icon="🌍"
                  unlocked={stats.totalRides >= 100}
                />
              </div>
              <button
                onClick={() => navigate("/achievements")}
                className="w-full mt-4 bg-teal-700 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition border-2 border-teal-800 pixelated text-sm flex items-center justify-center"
              >
                <Award size={16} className="mr-2" />
                WSZYSTKIE OSIĄGNIĘCIA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponent karty statystyk
const StatCard = ({ title, value, icon }) => (
  <div className="bg-indigo-900 bg-opacity-50 p-4 rounded-lg text-center border border-purple-700">
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-3xl font-bold text-amber-300">{value}</p>
    <p className="text-teal-300 pixelated text-xs mt-1">{title}</p>
  </div>
);

// Komponent karty osiągnięć
const AchievementCard = ({ title, description, icon, unlocked }) => (
  <div
    className={`p-3 rounded-lg text-center border ${
      unlocked
        ? "bg-green-900 bg-opacity-30 border-green-700"
        : "bg-indigo-900 bg-opacity-50 border-purple-700 opacity-50"
    }`}
  >
    <div className="text-2xl mb-1">{icon}</div>
    <p className="font-medium text-white pixelated text-xs">{title}</p>
    <p className="text-xs text-teal-300 mt-1">{description}</p>
  </div>
);

export default StatisticsPage;
