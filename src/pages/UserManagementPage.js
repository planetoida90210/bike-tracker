import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: 'user'
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Sprawdź, czy użytkownik jest administratorem
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data.role !== 'admin') {
          // Przekieruj do dashboardu, jeśli użytkownik nie jest administratorem
          navigate('/dashboard');
        } else {
          // Pobierz listę użytkowników
          fetchUsers();
        }
      } catch (err) {
        console.error('Błąd sprawdzania uprawnień:', err);
        setError('Nie masz uprawnień do tej strony');
        navigate('/dashboard');
      }
    };

    checkAdminStatus();
  }, [user.id, navigate]);

  // Pobierz listę użytkowników
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Pobierz użytkowników z Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (err) {
      console.error('Błąd pobierania użytkowników:', err);
      setError('Nie udało się pobrać listy użytkowników');
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
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Odśwież listę użytkowników
      await fetchUsers();
      
      setSuccess('Rola użytkownika została zaktualizowana');
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Błąd aktualizacji roli:', err);
      setError(`Błąd aktualizacji roli: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa dodawania nowego użytkownika
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.username) {
      setError('Email i nazwa użytkownika są wymagane');
      return;
    }
    
    try {
      setLoading(true);
      
      // Generuj losowe hasło
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Utwórz nowego użytkownika w Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: tempPassword,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Dodaj profil użytkownika
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            username: newUser.username,
            role: newUser.role,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (profileError) throw profileError;
      
      // Odśwież listę użytkowników
      await fetchUsers();
      
      setSuccess(`Użytkownik został dodany. Tymczasowe hasło: ${tempPassword}`);
      setNewUser({ email: '', username: '', role: 'user' });
      setShowAddUserForm(false);
      
    } catch (err) {
      console.error('Błąd dodawania użytkownika:', err);
      setError(`Błąd dodawania użytkownika: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa dezaktywacji użytkownika
  const handleDeactivateUser = async (userId) => {
    try {
      setLoading(true);
      
      // Dezaktywuj użytkownika w Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Odśwież listę użytkowników
      await fetchUsers();
      
      setSuccess('Użytkownik został dezaktywowany');
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Błąd dezaktywacji użytkownika:', err);
      setError(`Błąd dezaktywacji użytkownika: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Zarządzanie użytkownikami</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Powrót do dashboardu
          </button>
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            {showAddUserForm ? 'Anuluj' : 'Dodaj użytkownika'}
          </button>
        </div>
      </div>
      
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
      
      {showAddUserForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Dodaj nowego użytkownika</h2>
          <form onSubmit={handleAddUser}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-2">Nazwa użytkownika</label>
              <input
                id="username"
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="role" className="block text-gray-700 mb-2">Rola</label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="user">Użytkownik</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 transition'
              }`}
            >
              {loading ? 'Dodawanie...' : 'Dodaj użytkownika'}
            </button>
          </form>
        </div>
      )}
      
      {loading && !showAddUserForm ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Brak użytkowników do wyświetlenia.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nazwa użytkownika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data utworzenia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={loading}
                      >
                        <option value="user">Użytkownik</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.active !== false ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Aktywny
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Nieaktywny
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.active !== false && (
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={loading || user.id === user.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Dezaktywuj
                        </button>
                      )}
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
