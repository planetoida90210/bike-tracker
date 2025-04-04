import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  Trophy,
  Calendar,
  User,
  UserCheck,
  Clock,
  Check,
  X,
  Plus,
  ArrowLeft,
} from "lucide-react";

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);

        // Pobierz wyzwania, w których użytkownik jest twórcą lub przeciwnikiem
        const { data: challengesData, error: challengesError } = await supabase
          .from("challenges")
          .select(
            "*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)"
          )
          .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (challengesError) throw challengesError;

        // Pobierz listę użytkowników do wyboru przy tworzeniu wyzwania
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, username")
          .neq("id", user.id)
          .order("username", { ascending: true });

        if (usersError) throw usersError;

        setChallenges(challengesData || []);
        setUsers(usersData || []);
      } catch (err) {
        console.error("Błąd pobierania wyzwań:", err);
        setError("Nie udało się pobrać wyzwań");
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user.id]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  // Obsługa tworzenia nowego wyzwania
  const handleCreateChallenge = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Wybierz przeciwnika");
      return;
    }

    if (!endDate) {
      setError("Wybierz datę zakończenia wyzwania");
      return;
    }

    const endDateObj = new Date(endDate);
    const today = new Date();

    if (endDateObj <= today) {
      setError("Data zakończenia musi być w przyszłości");
      return;
    }

    try {
      setLoading(true);

      // Utwórz nowe wyzwanie w Supabase
      const { data, error } = await supabase.from("challenges").insert([
        {
          creator_id: user.id,
          opponent_id: selectedUser,
          start_date: today.toISOString().split("T")[0],
          end_date: endDate,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Dodaj powiadomienie dla przeciwnika
      await supabase.from("notifications").insert([
        {
          user_id: selectedUser,
          title: "Nowe wyzwanie!",
          message: "Zostałeś wyzwany na pojedynek rowerowy!",
          type: "challenge",
          related_id: data[0].id,
          created_at: new Date().toISOString(),
        },
      ]);

      // Odśwież listę wyzwań
      const { data: refreshedChallenges, error: refreshError } = await supabase
        .from("challenges")
        .select(
          "*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)"
        )
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (refreshError) throw refreshError;

      setChallenges(refreshedChallenges || []);
      setSelectedUser("");
      setEndDate("");
      setShowCreateForm(false);
      setSuccess("Wyzwanie zostało utworzone!");

      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd tworzenia wyzwania:", err);
      setError(`Błąd tworzenia wyzwania: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa akceptacji/odrzucenia wyzwania
  const handleChallengeResponse = async (challengeId, accept) => {
    try {
      setLoading(true);

      // Aktualizuj status wyzwania w Supabase
      const { error } = await supabase
        .from("challenges")
        .update({
          status: accept ? "active" : "cancelled",
        })
        .eq("id", challengeId);

      if (error) throw error;

      // Odśwież listę wyzwań
      const { data: refreshedChallenges, error: refreshError } = await supabase
        .from("challenges")
        .select(
          "*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)"
        )
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (refreshError) throw refreshError;

      setChallenges(refreshedChallenges || []);
      setSuccess(`Wyzwanie zostało ${accept ? "zaakceptowane" : "odrzucone"}!`);

      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd odpowiedzi na wyzwanie:", err);
      setError(`Błąd odpowiedzi na wyzwanie: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do określenia statusu wyzwania w przyjaznej formie
  const getChallengeStatusText = (challenge) => {
    switch (challenge.status) {
      case "pending":
        return "OCZEKUJE";
      case "active":
        return "W TRAKCIE";
      case "completed":
        return "ZAKOŃCZONE";
      case "cancelled":
        return "ANULOWANE";
      default:
        return challenge.status.toUpperCase();
    }
  };

  // Funkcja do określenia koloru statusu wyzwania
  const getChallengeStatusColor = (challenge) => {
    switch (challenge.status) {
      case "pending":
        return "bg-yellow-800 border-yellow-600 text-yellow-300";
      case "active":
        return "bg-blue-800 border-blue-600 text-blue-300";
      case "completed":
        return "bg-green-800 border-green-600 text-green-300";
      case "cancelled":
        return "bg-red-800 border-red-600 text-red-300";
      default:
        return "bg-gray-800 border-gray-600 text-gray-300";
    }
  };

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
            <Trophy size={24} className="mr-2 text-amber-300" />
            WYZWANIA
          </h1>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`${
            showCreateForm
              ? "bg-red-700 hover:bg-red-600 border-red-800"
              : "bg-purple-700 hover:bg-purple-600 border-purple-500"
          } text-white px-4 py-2 rounded-lg transition border-2 flex items-center`}
        >
          {showCreateForm ? (
            <>
              <X size={18} className="mr-1" />
              <span className="pixelated text-sm">ANULUJ</span>
            </>
          ) : (
            <>
              <Plus size={18} className="mr-1" />
              <span className="pixelated text-sm">NOWE WYZWANIE</span>
            </>
          )}
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

      {showCreateForm && (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
            <Plus size={18} className="mr-2" />
            NOWE WYZWANIE
          </h2>
          <form onSubmit={handleCreateChallenge}>
            <div className="mb-4">
              <label
                htmlFor="opponent"
                className="block text-teal-300 mb-2 pixelated text-sm"
              >
                WYBIERZ PRZECIWNIKA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-purple-300" />
                </div>
                <select
                  id="opponent"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full pl-10 px-3 py-2 bg-indigo-900 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-white"
                  required
                >
                  <option value="">Wybierz użytkownika</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="endDate"
                className="block text-teal-300 mb-2 pixelated text-sm"
              >
                DATA ZAKOŃCZENIA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-purple-300" />
                </div>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 px-3 py-2 bg-indigo-900 border-2 border-purple-500 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white border-2 flex items-center justify-center ${
                loading
                  ? "bg-gray-600 border-gray-700 cursor-not-allowed"
                  : "bg-purple-700 border-purple-500 hover:bg-purple-600 transition"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="pixelated text-sm">TWORZENIE...</span>
                </div>
              ) : (
                <>
                  <Trophy size={18} className="mr-2 text-amber-300" />
                  <span className="pixelated text-sm">UTWÓRZ WYZWANIE</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {loading && !showCreateForm ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-8 text-center border-2 border-purple-500">
          <Trophy
            size={64}
            className="mx-auto mb-4 text-amber-300 opacity-50"
          />
          <p className="text-white mb-4 pixelated">
            Nie masz jeszcze żadnych wyzwań.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated text-sm"
          >
            UTWÓRZ PIERWSZE WYZWANIE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-indigo-800 rounded-lg shadow-lg overflow-hidden border-2 border-purple-500"
            >
              <div className="p-4 border-b border-purple-700 bg-indigo-900">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white pixelated text-sm">
                    {challenge.creator.username} vs{" "}
                    {challenge.opponent.username}
                  </h2>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${getChallengeStatusColor(
                      challenge
                    )} pixelated`}
                  >
                    {getChallengeStatusText(challenge)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-purple-700 p-3 rounded bg-indigo-900 bg-opacity-50">
                    <p className="text-teal-300 text-xs flex items-center mb-1 pixelated">
                      <Calendar size={14} className="mr-1" />
                      START
                    </p>
                    <p className="font-medium text-white">
                      {formatDate(challenge.start_date)}
                    </p>
                  </div>
                  <div className="border border-purple-700 p-3 rounded bg-indigo-900 bg-opacity-50">
                    <p className="text-teal-300 text-xs flex items-center mb-1 pixelated">
                      <Calendar size={14} className="mr-1" />
                      KONIEC
                    </p>
                    <p className="font-medium text-white">
                      {formatDate(challenge.end_date)}
                    </p>
                  </div>
                </div>

                {challenge.status === "completed" && (
                  <div className="border border-green-600 p-3 bg-green-900 bg-opacity-30 rounded-lg">
                    <p className="text-green-300 text-xs flex items-center mb-1 pixelated">
                      <Trophy size={14} className="mr-1" />
                      ZWYCIĘZCA
                    </p>
                    <p className="font-medium text-white flex items-center">
                      <UserCheck size={18} className="mr-2 text-green-300" />
                      {challenge.winner
                        ? challenge.winner.username
                        : "Brak zwycięzcy"}
                    </p>
                  </div>
                )}

                {challenge.status === "pending" &&
                  challenge.opponent_id === user.id && (
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() =>
                          handleChallengeResponse(challenge.id, true)
                        }
                        disabled={loading}
                        className="flex-1 bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition border-2 border-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Check size={18} className="mr-1" />
                        <span className="pixelated text-sm">AKCEPTUJ</span>
                      </button>
                      <button
                        onClick={() =>
                          handleChallengeResponse(challenge.id, false)
                        }
                        disabled={loading}
                        className="flex-1 bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition border-2 border-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <X size={18} className="mr-1" />
                        <span className="pixelated text-sm">ODRZUĆ</span>
                      </button>
                    </div>
                  )}

                {challenge.status === "active" && (
                  <div className="border border-blue-600 p-3 bg-blue-900 bg-opacity-30 rounded-lg">
                    <p className="text-blue-300 text-xs flex items-center mb-1 pixelated">
                      <Clock size={14} className="mr-1" />
                      POZOSTAŁY CZAS
                    </p>
                    <p className="font-medium text-white">
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date(challenge.end_date) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}{" "}
                      dni
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;
