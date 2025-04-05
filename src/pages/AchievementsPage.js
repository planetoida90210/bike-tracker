// src/pages/AchievementsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { achievementServices } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Trophy, ArrowLeft, Award, Clock, Calendar, Flame } from "lucide-react";

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);

        // Pobierz wszystkie dostępne osiągnięcia
        const achievementsData = await achievementServices.getAllAchievements();

        // Pobierz osiągnięcia użytkownika
        const userAchievementsData =
          await achievementServices.getUserAchievements(user.id);

        setAchievements(achievementsData || []);
        setUserAchievements(userAchievementsData || []);
      } catch (err) {
        console.error("Błąd pobierania osiągnięć:", err);
        setError("Nie udało się pobrać osiągnięć");
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user.id]);

  // Sprawdź, czy użytkownik ma dane osiągnięcie
  const hasAchievement = (achievementId) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  // Grupowanie osiągnięć według typu
  const groupedAchievements = achievements.reduce((groups, achievement) => {
    const type = achievement.requirement_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(achievement);
    return groups;
  }, {});

  // Mapowanie typów osiągnięć na przyjazne nazwy
  const typeNames = {
    total_rides: "Liczba dojazdów",
    streak: "Serie dni",
    weekly: "Tygodniowe",
    monthly: "Miesięczne",
    special: "Specjalne",
  };

  // Ikony dla typów osiągnięć
  const typeIcons = {
    total_rides: <Trophy size={20} className="text-amber-300" />,
    streak: <Flame size={20} className="text-red-400" />,
    weekly: <Calendar size={20} className="text-blue-400" />,
    monthly: <Clock size={20} className="text-purple-400" />,
    special: <Award size={20} className="text-green-400" />,
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-indigo-900 bg-opacity-95">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mr-4 text-amber-300 hover:text-amber-100 transition flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span className="pixelated text-sm">WRÓĆ</span>
        </button>
        <h1 className="text-2xl font-bold text-white pixelated flex items-center">
          <Trophy size={24} className="mr-2 text-amber-300" />
          OSIĄGNIĘCIA
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border-2 border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.keys(groupedAchievements).map((type) => (
            <div
              key={type}
              className="bg-indigo-800 rounded-lg shadow-lg p-6 border-2 border-purple-500"
            >
              <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
                {typeIcons[type]}
                <span className="ml-2">
                  {typeNames[type] || type.toUpperCase()}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedAchievements[type].map((achievement) => {
                  const isUnlocked = hasAchievement(achievement.id);
                  const userAchievement = userAchievements.find(
                    (ua) => ua.achievement_id === achievement.id
                  );

                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 ${
                        isUnlocked
                          ? "bg-green-900 bg-opacity-30 border-green-700"
                          : "bg-indigo-900 bg-opacity-50 border-purple-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div
                          className={`text-sm font-bold px-2 py-1 rounded ${
                            isUnlocked
                              ? "bg-green-700 text-white"
                              : "bg-indigo-700 text-gray-300"
                          }`}
                        >
                          {isUnlocked ? "ODBLOKOWANE" : "ZABLOKOWANE"}
                        </div>
                      </div>

                      <h3 className="text-md font-bold text-white pixelated mb-1">
                        {achievement.name}
                      </h3>

                      <p className="text-sm text-teal-300 mb-2">
                        {achievement.description}
                      </p>

                      <div className="flex justify-between text-xs mt-2">
                        <div className="text-amber-300">
                          <span className="font-bold">
                            {achievement.points}
                          </span>{" "}
                          PKT
                        </div>
                        {isUnlocked && userAchievement.unlocked_at && (
                          <div className="text-gray-300">
                            Zdobyte: {formatDate(userAchievement.unlocked_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
