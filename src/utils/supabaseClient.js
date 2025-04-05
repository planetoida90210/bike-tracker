// src/utils/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funkcje pomocnicze dla obsługi ścieżek rowerowych
export const rideServices = {
  // Pobieranie przejazdów użytkownika
  getUserRides: async (userId) => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("user_id", userId)
      .order("ride_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Dodawanie nowego przejazdu
  addNewRide: async (userId, rideData, photoFile) => {
    try {
      // 1. Jeśli jest zdjęcie, prześlij je do storage
      let photoUrl = null;

      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `ride_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("ride-photos")
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("ride-photos")
          .getPublicUrl(filePath);

        photoUrl = data.publicUrl;
      }

      // 2. Zapisz przejazd w bazie
      const { data, error } = await supabase
        .from("rides")
        .insert([
          {
            user_id: userId,
            ride_date: rideData.date || new Date().toISOString().split("T")[0],
            ride_time:
              rideData.time ||
              new Date().toISOString().split("T")[1].substring(0, 8),
            photo_url: photoUrl,
            location: rideData.location,
            verified: false,
            points: 10, // Domyślnie 10 punktów
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Error adding ride:", error);
      throw error;
    }
  },

  // Pobieranie przejazdów do weryfikacji
  getRidesToVerify: async (userId) => {
    const { data, error } = await supabase
      .from("rides")
      .select("*, profiles(username)")
      .eq("verified", false)
      .neq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Weryfikowanie przejazdu
  verifyRide: async (rideId, userId, isApproved) => {
    const { error } = await supabase
      .from("rides")
      .update({
        verified: isApproved,
        verified_by: userId,
        verification_date: new Date().toISOString(),
        points: isApproved ? 10 : 0,
      })
      .eq("id", rideId);

    if (error) throw error;
    return true;
  },
};

// Funkcje pomocnicze dla osiągnięć
export const achievementServices = {
  // Pobieranie wszystkich dostępnych osiągnięć
  getAllAchievements: async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("requirement_type", { ascending: true })
      .order("requirement_value", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Pobieranie osiągnięć użytkownika
  getUserAchievements: async (userId) => {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("*, achievements(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  },
};

// Funkcje pomocnicze dla wyzwań (challenges)
export const challengeServices = {
  // Pobieranie wyzwań użytkownika
  getUserChallenges: async (userId) => {
    const { data, error } = await supabase
      .from("challenges")
      .select(
        "*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)"
      )
      .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Tworzenie nowego wyzwania
  createChallenge: async (creatorId, opponentId, endDate) => {
    const startDate = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("challenges")
      .insert([
        {
          creator_id: creatorId,
          opponent_id: opponentId,
          start_date: startDate,
          end_date: endDate,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Odpowiedź na wyzwanie (akceptacja lub odrzucenie)
  respondToChallenge: async (challengeId, accept) => {
    const { error } = await supabase
      .from("challenges")
      .update({
        status: accept ? "active" : "cancelled",
      })
      .eq("id", challengeId);

    if (error) throw error;
    return true;
  },
};

// Funkcje pomocnicze dla profili użytkowników
export const profileServices = {
  // Pobieranie profilu użytkownika
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Aktualizacja profilu użytkownika
  updateUserProfile: async (userId, profileData) => {
    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId);

    if (error) throw error;
    return true;
  },

  // Pobieranie rankingu użytkowników
  getUserRanking: async (limit = 10) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, total_rides, total_points")
      .order("total_points", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

// Funkcje pomocnicze dla powiadomień
export const notificationServices = {
  // Pobieranie powiadomień użytkownika
  getUserNotifications: async (userId) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Oznaczanie powiadomienia jako przeczytane
  markNotificationAsRead: async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  },
};
