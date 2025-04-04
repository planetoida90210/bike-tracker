import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        
        // Pobierz wyzwania, w których użytkownik jest twórcą lub przeciwnikiem
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)')
          .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (challengesError) throw challengesError;
        
        // Pobierz listę użytkowników do wyboru przy tworzeniu wyzwania
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username')
          .neq('id', user.id)
          .order('username', { ascending: true });
        
        if (usersError) throw usersError;
        
        setChallenges(challengesData || []);
        setUsers(usersData || []);
        
      } catch (err) {
        console.error('Błąd pobierania wyzwań:', err);
        setError('Nie udało się pobrać wyzwań');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user.id]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
  };

  // Obsługa tworzenia nowego wyzwania
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Wybierz przeciwnika');
      return;
    }
    
    if (!endDate) {
      setError('Wybierz datę zakończenia wyzwania');
      return;
    }
    
    const endDateObj = new Date(endDate);
    const today = new Date();
    
    if (endDateObj <= today) {
      setError('Data zakończenia musi być w przyszłości');
      return;
    }
    
    try {
      setLoading(true);
      
      // Utwórz nowe wyzwanie w Supabase
      const { data, error } = await supabase
        .from('challenges')
        .insert([
          {
            creator_id: user.id,
            opponent_id: selectedUser,
            start_date: today.toISOString().split('T')[0],
            end_date: endDate,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (error) throw error;
      
      // Dodaj powiadomienie dla przeciwnika
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: selectedUser,
            title: 'Nowe wyzwanie!',
            message: 'Zostałeś wyzwany na pojedynek rowerowy!',
            type: 'challenge',
            related_id: data[0].id,
            created_at: new Date().toISOString()
          }
        ]);
      
      // Odśwież listę wyzwań
      const { data: refreshedChallenges, error: refreshError } = await supabase
        .from('challenges')
        .select('*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (refreshError) throw refreshError;
      
      setChallenges(refreshedChallenges || []);
      setSelectedUser('');
      setEndDate('');
      setShowCreateForm(false);
      setSuccess('Wyzwanie zostało utworzone!');
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Błąd tworzenia wyzwania:', err);
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
        .from('challenges')
        .update({ 
          status: accept ? 'active' : 'cancelled'
        })
        .eq('id', challengeId);
      
      if (error) throw error;
      
      // Odśwież listę wyzwań
      const { data: refreshedChallenges, error: refreshError } = await supabase
        .from('challenges')
        .select('*, creator:creator_id(username), opponent:opponent_id(username), winner:winner_id(username)')
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (refreshError) throw refreshError;
      
      setChallenges(refreshedChallenges || []);
      setSuccess(`Wyzwanie zostało ${accept ? 'zaakceptowane' : 'odrzucone'}!`);
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Błąd odpowiedzi na wyzwanie:', err);
      setError(`Błąd odpowiedzi na wyzwanie: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do określenia statusu wyzwania w przyjaznej formie
  const getChallengeStatusText = (challenge) => {
    switch (challenge.status) {
      case 'pending':
        return 'Oczekuje na akceptację';
      case 'active':
        return 'W trakcie';
      case 'completed':
        return 'Zakończone';
      case 'cancelled':
        return 'Anulowane';
      default:
        return challenge.status;
    }
  };

  // Funkcja do określenia koloru statusu wyzwania
  const getChallengeStatusColor = (challenge) => {
    switch (challenge.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wyzwania</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Powrót do dashboardu
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            {showCreateForm ? 'Anuluj' : 'Nowe wyzwanie'}
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
      
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Utwórz nowe wyzwanie</h2>
          <form onSubmit={handleCreateChallenge}>
            <div className="mb-4">
              <label htmlFor="opponent" className="block text-gray-700 mb-2">Wybierz przeciwnika</label>
              <select
                id="opponent"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Wybierz użytkownika</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="endDate" className="block text-gray-700 mb-2">Data zakończenia wyzwania</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 transition'
              }`}
            >
              {loading ? 'Tworzenie...' : 'Utwórz wyzwanie'}
            </button>
          </form>
        </div>
      )}
      
      {loading && !showCreateForm ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych wyzwań.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Utwórz pierwsze wyzwanie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    Wyzwanie: {challenge.creator.username} vs {challenge.opponent.username}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getChallengeStatusColor(challenge)}`}>
                    {getChallengeStatusText(challenge)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 text-sm">Data rozpoczęcia</p>
                    <p className="font-medium">{formatDate(challenge.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Data zakończenia</p>
                    <p className="font-medium">{formatDate(challenge.end_date)}</p>
                  </div>
                </div>
                
                {challenge.status === 'completed' && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Zwycięzca</p>
                    <p className="font-medium">{challenge.winner ? challenge.winner.username : 'Brak zwycięzcy'}</p>
                  </div>
                )}
                
                {challenge.status === 'pending' && challenge.opponent_id === user.id && (
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleChallengeResponse(challenge.id, true)}
                      disabled={loading}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Akceptuj
                    </button>
                    <button
                      onClick={() => handleChallengeResponse(challenge.id, false)}
                      disabled={loading}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Odrzuć
                    </button>
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
