export const updateUserStats = async (supabase, userId) => {
  try {
    // 1. Pobierz wszystkie zweryfikowane przejazdy użytkownika
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("points")
      .eq("user_id", userId)
      .eq("verified", true);

    if (ridesError) throw ridesError;

    // 2. Oblicz sumę przejazdów i punktów
    const totalRides = rides ? rides.length : 0;
    const totalPoints = rides
      ? rides.reduce((sum, ride) => sum + (ride.points || 0), 0)
      : 0;

    // 3. Zaktualizuj profil użytkownika
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        total_rides: totalRides,
        total_points: totalPoints,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return { totalRides, totalPoints };
  } catch (err) {
    console.error("Błąd aktualizacji statystyk użytkownika:", err);
    throw err;
  }
};
