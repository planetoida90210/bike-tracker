import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  ArrowLeft,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Check,
  X,
  Bike,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    userId: null,
    username: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    role: "user",
  });
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // Zmiana nazwy na currentUser dla jasności

  useEffect(() => {
    // Sprawdź, czy użytkownik jest administratorem
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (error) throw error;

        if (data.role !== "admin") {
          // Przekieruj do dashboardu, jeśli użytkownik nie jest administratorem
          navigate("/dashboard");
        } else {
          // Pobierz listę użytkowników
          fetchUsers();
        }
      } catch (err) {
        console.error("Błąd sprawdzania uprawnień:", err);
        setError("Nie masz uprawnień do tej strony");
        navigate("/dashboard");
      }
    };

    checkAdminStatus();
  }, [currentUser.id, navigate]);

  // Pobierz listę użytkowników
  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Pobierz użytkowników z Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error("Błąd pobierania użytkowników:", err);
      setError("Nie udało się pobrać listy użytkowników");
    } finally {
      setLoading(false);
    }
  };

  // Obsługa zmiany roli użytkownika
  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);

      // Aktualizuj rolę użytkownika w Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Odśwież listę użytkowników
      await fetchUsers();

      setSuccess("Rola użytkownika została zaktualizowana");

      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd aktualizacji roli:", err);
      setError(`Błąd aktualizacji roli: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa dodawania nowego użytkownika
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.email || !newUser.username) {
      setError("Email i nazwa użytkownika są wymagane");
      return;
    }

    try {
      setLoading(true);

      // Generuj losowe hasło
      const tempPassword = Math.random().toString(36).slice(-8);

      // Utwórz nowego użytkownika w Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: newUser.email,
          password: tempPassword,
          email_confirm: true,
        });

      if (authError) throw authError;

      // Dodaj profil użytkownika
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          username: newUser.username,
          role: newUser.role,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      // Odśwież listę użytkowników
      await fetchUsers();

      setSuccess(`Użytkownik został dodany. Tymczasowe hasło: ${tempPassword}`);
      setNewUser({ email: "", username: "", role: "user" });
      setShowAddUserForm(false);
    } catch (err) {
      console.error("Błąd dodawania użytkownika:", err);
      setError(`Błąd dodawania użytkownika: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa dezaktywacji użytkownika
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Czy na pewno chcesz dezaktywować tego użytkownika?")) {
      return;
    }

    try {
      setLoading(true);

      // Dezaktywuj użytkownika w Supabase
      const { error } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("id", userId);

      if (error) throw error;

      // Odśwież listę użytkowników
      await fetchUsers();

      setSuccess("Użytkownik został dezaktywowany");

      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd dezaktywacji użytkownika:", err);
      setError(`Błąd dezaktywacji użytkownika: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Nowa funkcja: Pokaż okno potwierdzenia usunięcia
  const showDeleteUserConfirmation = (userId, username) => {
    setDeleteConfirmation({
      show: true,
      userId,
      username,
    });
  };

  // Nowa funkcja: Obsługa usuwania użytkownika
  const handleDeleteUser = async () => {
    if (!deleteConfirmation.userId) return;

    try {
      setLoading(true);

      // Wywołaj uproszczoną funkcję SQL
      const { data, error } = await supabase.rpc("delete_user_data", {
        user_id: deleteConfirmation.userId,
      });

      if (error) {
        console.error("Błąd RPC:", error);
        throw error;
      }

      console.log("Odpowiedź z funkcji delete_user_data:", data);

      // Odśwież listę użytkowników
      await fetchUsers();

      setSuccess(
        `Użytkownik ${deleteConfirmation.username} został usunięty z systemu`
      );

      // Zamknij okno potwierdzenia
      setDeleteConfirmation({ show: false, userId: null, username: "" });

      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Błąd usuwania użytkownika:", err);
      setError(
        `Błąd usuwania użytkownika: ${err.message || JSON.stringify(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("pl-PL", options);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-indigo-900 min-h-screen">
      {/* Modal potwierdzenia usunięcia użytkownika */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-indigo-800 border-2 border-red-500 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-red-400">
              <AlertTriangle className="mr-2" size={24} />
              <h3 className="text-xl font-bold pixelated">
                UWAGA: USUWANIE KONTA
              </h3>
            </div>

            <p className="text-white mb-4">
              Czy na pewno chcesz{" "}
              <span className="text-red-400 font-bold">CAŁKOWICIE USUNĄĆ</span>{" "}
              użytkownika{" "}
              <span className="text-amber-300 font-bold">
                {deleteConfirmation.username}
              </span>
              ?
            </p>

            <p className="text-gray-300 text-sm mb-6">
              To działanie jest nieodwracalne! Zostaną usunięte wszystkie dane
              użytkownika, jego przejazdy i konto uwierzytelniania.
            </p>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() =>
                  setDeleteConfirmation({
                    show: false,
                    userId: null,
                    username: "",
                  })
                }
                className="px-4 py-2 bg-indigo-700 text-white rounded-lg border-2 border-indigo-600 hover:bg-indigo-600 transition pixelated flex-1 flex items-center justify-center"
              >
                <X size={16} className="mr-2" />
                ANULUJ
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-700 text-white rounded-lg border-2 border-red-600 hover:bg-red-600 transition pixelated flex-1 flex items-center justify-center"
              >
                <Trash2 size={16} className="mr-2" />
                USUŃ PERMANENTNIE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white pixelated flex items-center mb-4 sm:mb-0">
          <Users size={24} className="mr-2 text-amber-300" />
          ZARZĄDZANIE UŻYTKOWNIKAMI
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition border-2 border-indigo-500 pixelated flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-1" />
            DASHBOARD
          </button>
          <button
            onClick={() => navigate("/ride-management")}
            className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition border-2 border-teal-500 pixelated flex items-center justify-center"
          >
            <Bike size={18} className="mr-1" />
            PRZEJAZDY
          </button>
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition border-2 border-purple-500 pixelated flex items-center justify-center"
          >
            {showAddUserForm ? (
              <>
                <X size={18} className="mr-1" /> ANULUJ
              </>
            ) : (
              <>
                <UserPlus size={18} className="mr-1" /> DODAJ
              </>
            )}
          </button>
        </div>
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

      {showAddUserForm && (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold mb-4 text-amber-300 pixelated flex items-center">
            <UserPlus size={20} className="mr-2" />
            DODAJ NOWEGO UŻYTKOWNIKA
          </h2>
          <form onSubmit={handleAddUser}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-teal-300 mb-2 pixelated text-sm flex items-center"
              >
                <Mail size={16} className="mr-1" /> EMAIL
              </label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-purple-600 bg-indigo-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-teal-300 mb-2 pixelated text-sm flex items-center"
              >
                <UserCheck size={16} className="mr-1" /> NAZWA UŻYTKOWNIKA
              </label>
              <input
                id="username"
                type="text"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-purple-600 bg-indigo-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="role"
                className="block text-teal-300 mb-2 pixelated text-sm flex items-center"
              >
                <Shield size={16} className="mr-1" /> ROLA
              </label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-purple-600 bg-indigo-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="user">Użytkownik</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white pixelated ${
                loading
                  ? "bg-gray-700 border-2 border-gray-600 cursor-not-allowed"
                  : "bg-purple-700 hover:bg-purple-600 transition border-2 border-purple-500"
              }`}
            >
              {loading ? "DODAWANIE..." : "DODAJ UŻYTKOWNIKA"}
            </button>
          </form>
        </div>
      )}

      {loading && !showAddUserForm ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-300"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-indigo-800 rounded-lg shadow-lg p-8 text-center border-2 border-purple-500">
          <Users size={64} className="mx-auto text-amber-300 opacity-50 mb-4" />
          <p className="text-white pixelated">
            Brak użytkowników do wyświetlenia.
          </p>
        </div>
      ) : (
        <div className="bg-indigo-800 rounded-lg shadow-lg overflow-hidden border-2 border-purple-500">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-700">
              <thead className="bg-indigo-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Nazwa użytkownika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Data utworzenia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider pixelated">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-indigo-900 bg-opacity-50 divide-y divide-purple-700">
                {users.map((tableUser) => (
                  <tr key={tableUser.id} className="hover:bg-indigo-800">
                    <td className="px-6 py-4 whitespace-nowrap text-white flex items-center">
                      <UserCheck className="mr-2 text-teal-400" size={16} />
                      {tableUser.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {tableUser.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tableUser.role || "user"}
                        onChange={(e) =>
                          handleRoleChange(tableUser.id, e.target.value)
                        }
                        className="px-2 py-1 border-2 border-purple-600 bg-indigo-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                        disabled={loading || tableUser.id === currentUser.id}
                      >
                        <option value="user">Użytkownik</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-teal-400" />
                        <span className="text-white">
                          {formatDate(tableUser.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tableUser.active !== false ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300 border border-green-700 pixelated flex items-center">
                          <Check size={12} className="mr-1" />
                          AKTYWNY
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-300 border border-red-700 pixelated flex items-center">
                          <X size={12} className="mr-1" />
                          NIEAKTYWNY
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {tableUser.active !== false &&
                          tableUser.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeactivateUser(tableUser.id)}
                              disabled={loading}
                              className="flex items-center px-2 py-1 rounded text-xs bg-yellow-900 text-yellow-300 hover:bg-yellow-800 border border-yellow-700 pixelated"
                              title="Dezaktywuj konto"
                            >
                              <UserX size={12} className="mr-1" />
                              DEZAKTYWUJ
                            </button>
                          )}

                        {/* Nowy przycisk "USUŃ" */}
                        {tableUser.id !== currentUser.id && (
                          <button
                            onClick={() =>
                              showDeleteUserConfirmation(
                                tableUser.id,
                                tableUser.username
                              )
                            }
                            disabled={loading}
                            className="flex items-center px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800 border border-red-700 pixelated"
                            title="Usuń konto permanentnie"
                          >
                            <Trash2 size={12} className="mr-1" />
                            USUŃ
                          </button>
                        )}
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

export default UserManagementPage;
