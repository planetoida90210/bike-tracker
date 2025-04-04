import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        // Pobierz wszystkie dostępne osiągnięcia
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('requirement_value', { ascending: true });
        
        if (achievementsError) throw achievementsError;
        
        // Pobierz osiągnięcia użytkownika
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id);
        
        if (userAchievementsError) throw userAchievementsError;
        
        setAchievements(achievementsData || []);
        setUserAchievements(userAchievementsData || []);
        
      } catch (err) {
        console.error('Błąd pobierania osiągnięć:', err);
        setError('Nie udało się pobrać osiągnięć');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user.id]);

  // Sprawdź, czy użytkownik ma dane osiągnięcie
  const hasAchievement = (achievementId) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
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
    'total_rides': 'Liczba dojazdów',
    'streak': 'Serie dni',
    'weekly': 'Tygodniowe',
    'monthly': 'Miesięczne'
  };

  // Ikony dla osiągnięć
  const achievementIcons = {
    'total_rides': '🚲',
    'streak': '🔥',
    'weekly': '📅',
    'monthly': '📆'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Osiągnięcia</h1>
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
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Twoje odznaki</h2>
            
            {userAchievements.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych odznak.</p>
                <p className="text-gray-600">Dojeżdżaj regularnie rowerem do pracy, aby zdobywać odznaki!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userAchievements.map((ua) => (
                  <div key={ua.id} className="bg-green-100 p-4 rounded-lg text-center">
                    <div className="text-3xl mb-2">
                      {achievementIcons[ua.achievements.requirement_type] || '🏆'}
                    </div>
                    <p className="font-medium">{ua.achievements.name}</p>
                    <p className="text-xs text-gray-600">{ua.achievements.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Zdobyto: {formatDate(ua.achieved_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Dostępne osiągnięcia</h2>
            
            {Object.keys(groupedAchievements).length === 0 ? (
              <p className="text-gray-600">Brak dostępnych osiągnięć</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAchievements).map(([type, typeAchievements]) => (
                  <div key={type}>
                    <h3 className="font-semibold text-lg mb-3">{typeNames[type] || type}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {typeAchievements.map((achievement) => {
                        const achieved = hasAchievement(achievement.id);
                        return (
                          <div 
                            key={achievement.id} 
                            className={`p-4 rounded-lg ${
                              achieved ? 'bg-green-100 border border-green-200' : 'bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="text-3xl mr-3">
                                {achievementIcons[achievement.requirement_type] || '🏆'}
                              </div>
                              <div>
                                <h4 className="font-medium">{achievement.name}</h4>
                                <p className="text-sm text-gray-600">{achievement.description}</p>
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    {achieved ? 'Zdobyto!' : 'Niezdobyte'}
                                  </span>
                                  <span className="text-xs font-semibold text-primary">
                                    +{achievement.points} pkt
                                  </span>
                                </div>
                              </div>
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
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
