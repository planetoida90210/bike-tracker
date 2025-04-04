import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Sprawdź, czy użytkownik jest administratorem
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setIsAdmin(data.role === 'admin');
      } catch (err) {
        console.error('Błąd sprawdzania uprawnień:', err);
      }
    };

    checkAdminStatus();
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  // Nie pokazuj nawigacji na stronach logowania i rejestracji
  if (['/login', '/register', '/'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="flex items-center">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          Bike Tracker
        </Link>
      </div>

      <button 
        className="navbar-toggle md:hidden"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/dashboard" 
          className={`${location.pathname === '/dashboard' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Dashboard
        </Link>
        <Link 
          to="/add-ride" 
          className={`${location.pathname === '/add-ride' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Dodaj dojazd
        </Link>
        <Link 
          to="/statistics" 
          className={`${location.pathname === '/statistics' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Statystyki
        </Link>
        <Link 
          to="/achievements" 
          className={`${location.pathname === '/achievements' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Osiągnięcia
        </Link>
        <Link 
          to="/challenges" 
          className={`${location.pathname === '/challenges' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Wyzwania
        </Link>
        <Link 
          to="/verification" 
          className={`${location.pathname === '/verification' ? 'text-primary font-bold' : 'text-gray-700'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Weryfikacja
        </Link>
        {isAdmin && (
          <Link 
            to="/user-management" 
            className={`${location.pathname === '/user-management' ? 'text-primary font-bold' : 'text-gray-700'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Zarządzanie użytkownikami
          </Link>
        )}
        <button 
          onClick={() => {
            setIsMenuOpen(false);
            handleSignOut();
          }}
          className="text-red-600 hover:text-red-800"
        >
          Wyloguj
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
