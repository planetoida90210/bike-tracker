import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Komponent do wyświetlania wykresu aktywności
const ActivityChart = ({ data }) => {
  // Uproszczona implementacja wykresu jako kolorowe paski
  const maxValue = Math.max(...data.map(d => d.count)) || 1;
  
  return (
    <div className="mt-4">
      <div className="flex items-end h-32 space-x-1">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="bg-primary hover:bg-opacity-80 transition rounded-t w-full"
            style={{ 
              height: `${(item.count / maxValue) * 100}%`,
              minHeight: item.count > 0 ? '8px' : '0'
            }}
            title={`${item.label}: ${item.count} dojazdów`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        {data.map((item, index) => (
          <div key={index} className="text-center" style={{ width: '100%' }}>
            {item.label}
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
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        
        // Pobierz dojazdy użytkownika
        const { data: rides, error } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Pobierz ranking użytkowników
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('profiles')
          .select('id, username, total_rides, total_points')
          .order('total_points', { ascending: false })
          .limit(5);
        
        if (leaderboardError) throw leaderboardError;
        
        // Oblicz statystyki
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // Dojazdy w tym miesiącu
        const thisMonthRides = rides.filter(ride => {
          const rideDate = new Date(ride.ride_date);
          return rideDate.getMonth() === thisMonth && rideDate.getFullYear() === thisYear;
        }).length;
        
        // Dojazdy w tym tygodniu
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const thisWeekRides = rides.filter(ride => {
          const rideDate = new Date(ride.ride_date);
          return rideDate >= startOfWeek;
        }).length;
        
        // Zweryfikowane dojazdy
        const verifiedRides = rides.filter(ride => ride.verified).length;
        
        // Suma punktów
        const totalPoints = rides.reduce((sum, ride) => sum + (ride.points || 0), 0);
        
        // Dane tygodniowe (ostatnie 7 dni)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);
          
          const count = rides.filter(ride => {
            const rideDate = new Date(ride.ride_date);
            return rideDate >= date && rideDate < nextDate;
          }).length;
          
          const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
          weeklyData.push({
            label: dayNames[date.getDay()],
            count
          });
        }
        
        // Dane miesięczne (ostatnie 6 miesięcy)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          
          const month = date.getMonth();
          const year = date.getFullYear();
          
          const count = rides.filter(ride => {
            const rideDate = new Date(ride.ride_date);
            return rideDate.getMonth() === month && rideDate.getFullYear() === year;
          }).length;
          
          const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
          monthlyData.push({
            label: monthNames[month],
            count
          });
        }
        
        // Oblicz aktualną serię dni
        let streakDays = 0;
        const sortedDates = rides
          .map(ride => ride.ride_date)
          .sort((a, b) => new Date(b) - new Date(a)); // Sortuj od najnowszych
        
        if (sortedDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          
          // Sprawdź, czy jest dojazd dzisiaj lub wczoraj
          const latestRideDate = new Date(sortedDates[0]);
          latestRideDate.setHours(0, 0, 0, 0);
          
          if (latestRideDate.getTime() === today.getTime() || latestRideDate.getTime() === yesterday.getTime()) {
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
          monthlyData
        });
        
        setLeaderboard(leaderboardData || []);
        
      } catch (err) {
        console.error('Błąd pobierania statystyk:', err);
        setError('Nie udało się pobrać statystyk');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statystyki</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          Powrót do dashboardu
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Twoje statystyki</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">Łączna liczba dojazdów</p>
                <p className="text-3xl font-bold text-primary">{stats.totalRides}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">Punkty</p>
                <p className="text-3xl font-bold text-primary">{stats.totalPoints}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">W tym tygodniu</p>
                <p className="text-3xl font-bold text-primary">{stats.thisWeekRides}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">W tym miesiącu</p>
                <p className="text-3xl font-bold text-primary">{stats.thisMonthRides}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">Seria dni</p>
                <p className="text-3xl font-bold text-primary">{stats.streakDays}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-600">Zweryfikowane</p>
                <p className="text-3xl font-bold text-primary">{stats.verifiedRides}</p>
              </div>
            </div>
            
            <h3 className="font-semibold mb-2">Aktywność w tym tygodniu</h3>
            <ActivityChart data={stats.weeklyData} />
            
            <h3 className="font-semibold mt-6 mb-2">Aktywność miesięczna</h3>
            <ActivityChart data={stats.monthlyData} />
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Ranking</h2>
              {leaderboard.length === 0 ? (
                <p className="text-gray-600">Brak danych do wyświetlenia</p>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center p-3 rounded-lg ${
                        item.id === user.id ? 'bg-green-100 border border-green-200' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{item.username}</p>
                        <p className="text-sm text-gray-600">{item.total_rides} dojazdów</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{item.total_points} pkt</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/leaderboard')}
                className="w-full mt-4 bg-secondary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition"
              >
                Zobacz pełny ranking
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Twoje osiągnięcia</h2>
              <p className="text-gray-600 mb-4">Funkcja osiągnięć będzie dostępna wkrótce...</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 p-3 rounded-lg text-center opacity-50">
                  <div className="text-2xl mb-1">🚲</div>
                  <p className="font-medium">Początkujący</p>
                  <p className="text-xs text-gray-600">5 dojazdów</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-center opacity-50">
                  <div className="text-2xl mb-1">🔥</div>
                  <p className="font-medium">Seria 5 dni</p>
                  <p className="text-xs text-gray-600">5 dni z rzędu</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-center opacity-50">
                  <div className="text-2xl mb-1">🏆</div>
                  <p className="font-medium">Mistrz</p>
                  <p className="text-xs text-gray-600">50 dojazdów</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-center opacity-50">
                  <div className="text-2xl mb-1">🌍</div>
                  <p className="font-medium">Ekolog</p>
                  <p className="text-xs text-gray-600">100 dojazdów</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
