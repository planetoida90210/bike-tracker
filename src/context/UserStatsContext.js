// src/context/UserStatsContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "./AuthContext";

const UserStatsContext = createContext();

export const UserStatsProvider = ({ children }) => {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userRides, setUserRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalPoints: 0,
    weeklyRides: 0,
    monthlyRides: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserStats = async () => {
      try {
        setLoading(true);

        // Pobierz profil użytkownika
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profileData);

        // Pobierz przejazdy użytkownika
        const { data: ridesData, error: ridesError } = await supabase
          .from("rides")
          .select("*")
          .eq("user_id", user.id)
          .order("ride_date", { ascending: false });

        if (ridesError) throw ridesError;
        setUserRides(ridesData || []);

        // Pobierz osiągnięcia użytkownika
        const { data: userAchData, error: userAchError } = await supabase
          .from("user_achievements")
          .select("*, achievements(*)")
          .eq("user_id", user.id);

        if (userAchError) throw userAchError;
        setUserAchievements(userAchData || []);

        // Pobierz wszystkie osiągnięcia
        const { data: allAchData, error: allAchError } = await supabase
          .from("achievements")
          .select("*");

        if (allAchError) throw allAchError;
        setAllAchievements(allAchData || []);

        // Oblicz statystyki
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyRidesCount =
          ridesData?.filter((ride) => new Date(ride.ride_date) >= startOfWeek)
            .length || 0;

        const monthlyRidesCount =
          ridesData?.filter((ride) => new Date(ride.ride_date) >= startOfMonth)
            .length || 0;

        setStats({
          totalRides: profileData?.total_rides || 0,
          totalPoints: profileData?.total_points || 0,
          weeklyRides: weeklyRidesCount,
          monthlyRides: monthlyRidesCount,
          currentStreak: profileData?.streak_days || 0,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  // Funkcja do odświeżania danych
  const refreshStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Pobierz profil użytkownika
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profileData);

      // Pobierz przejazdy użytkownika
      const { data: ridesData } = await supabase
        .from("rides")
        .select("*")
        .eq("user_id", user.id)
        .order("ride_date", { ascending: false });

      setUserRides(ridesData || []);

      // Pobierz osiągnięcia użytkownika
      const { data: userAchData } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user.id);

      setUserAchievements(userAchData || []);

      // Oblicz statystyki
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const weeklyRidesCount =
        ridesData?.filter((ride) => new Date(ride.ride_date) >= startOfWeek)
          .length || 0;

      const monthlyRidesCount =
        ridesData?.filter((ride) => new Date(ride.ride_date) >= startOfMonth)
          .length || 0;

      setStats({
        totalRides: profileData?.total_rides || 0,
        totalPoints: profileData?.total_points || 0,
        weeklyRides: weeklyRidesCount,
        monthlyRides: monthlyRidesCount,
        currentStreak: profileData?.streak_days || 0,
      });
    } catch (error) {
      console.error("Error refreshing user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sprawdź czy użytkownik ma osiągnięcie
  const hasAchievement = (achievementId) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  // Pobierz postęp dla osiągnięcia
  const getAchievementProgress = (achievementType, requirementValue) => {
    switch (achievementType) {
      case "total_rides":
        return {
          current: stats.totalRides,
          target: requirementValue,
          percentage: Math.min(
            100,
            Math.round((stats.totalRides / requirementValue) * 100)
          ),
        };
      case "streak":
        return {
          current: stats.currentStreak,
          target: requirementValue,
          percentage: Math.min(
            100,
            Math.round((stats.currentStreak / requirementValue) * 100)
          ),
        };
      case "weekly":
        return {
          current: stats.weeklyRides,
          target: requirementValue,
          percentage: Math.min(
            100,
            Math.round((stats.weeklyRides / requirementValue) * 100)
          ),
        };
      case "monthly":
        return {
          current: stats.monthlyRides,
          target: requirementValue,
          percentage: Math.min(
            100,
            Math.round((stats.monthlyRides / requirementValue) * 100)
          ),
        };
      default:
        return { current: 0, target: requirementValue, percentage: 0 };
    }
  };

  return (
    <UserStatsContext.Provider
      value={{
        userProfile,
        userRides,
        userAchievements,
        allAchievements,
        stats,
        loading,
        refreshStats,
        hasAchievement,
        getAchievementProgress,
      }}
    >
      {children}
    </UserStatsContext.Provider>
  );
};

export const useUserStats = () => useContext(UserStatsContext);

export default UserStatsContext;
