import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Pobierz dojazdy użytkownika
    const fetchRides = async () => {
      try {
        setLoading(true);
        
        // Pobierz dojazdy z Supabase
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', user.id)
          .order('ride_date', { ascending: false });
        
        if (error) throw error;
        
        setRides(data || []);
      } catch (err) {
        console.error('Błąd pobierania dojazdów:', err);
        setError('Nie udało się pobrać historii dojazdów');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [user.id]);

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => navigate('/add-ride')}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          Dodaj dojazd
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Twoje statystyki</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">Łączna liczba dojazdów</p>
              <p className="text-3xl font-bold text-primary">{rides.length}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">Punkty</p>
              <p className="text-3xl font-bold text-primary">
                {rides.reduce((sum, ride) => sum + (ride.points || 0), 0)}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">W tym miesiącu</p>
              <p className="text-3xl font-bold text-primary">
                {rides.filter(ride => {
                  const rideDate = new Date(ride.ride_date);
                  const now = new Date();
                  return rideDate.getMonth() === now.getMonth() && 
                         rideDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">Zweryfikowane</p>
              <p className="text-3xl font-bold text-primary">
                {rides.filter(ride => ride.verified).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ranking</h2>
          <p className="text-gray-600 mb-4">Funkcja rankingu będzie dostępna wkrótce...</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full bg-secondary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition"
          >
            Zobacz pełny ranking
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Historia dojazdów</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych zarejestrowanych dojazdów.</p>
            <button
              onClick={() => navigate('/add-ride')}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              Dodaj pierwszy dojazd
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zdjęcie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punkty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(ride.ride_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.photo_url ? (
                        <img 
                          src={ride.photo_url} 
                          alt="Zdjęcie weryfikacyjne" 
                          className="h-16 w-16 object-cover rounded"
                          onClick={() => window.open(ride.photo_url, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <span className="text-gray-500">Brak zdjęcia</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Zweryfikowany
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Oczekuje na weryfikację
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ride.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
