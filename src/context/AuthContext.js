import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../utils/supabaseClient";

// Tworzenie kontekstu autentykacji
const AuthContext = createContext(null);

// Hook do używania kontekstu autentykacji
export const useAuth = () => useContext(AuthContext);

// Provider kontekstu autentykacji
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sprawdzenie sesji przy ładowaniu
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data?.session) {
          const { data: userData, error: userError } =
            await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          setUser(userData.user);
        }
      } catch (err) {
        console.error("Błąd sprawdzania sesji:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Nasłuchiwanie zmian w autentykacji
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Funkcja logowania
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funkcja rejestracji
  const signUp = async (email, password, username) => {
    try {
      setLoading(true);

      // Rejestracja użytkownika w auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data && data.user) {
        // Tworzenie profilu użytkownika w tabeli profiles
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username: username,
            email: email,
            role: "user",
            created_at: new Date().toISOString(),
          },
        ]);

        if (profileError) {
          console.error("Błąd tworzenia profilu:", profileError);
          // Mimo błędu profilu, kontynuujemy - użytkownik został utworzony w auth
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error("Błąd rejestracji:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Funkcja wylogowania
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Wartość kontekstu
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
