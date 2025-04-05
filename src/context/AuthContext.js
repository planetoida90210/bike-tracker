// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprawdź aktualną sesję przy ładowaniu
    const setData = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error setting user:", error);
      } finally {
        setLoading(false);
      }
    };

    setData();

    // Słuchaj zmian w statusie autentykacji
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Logowanie
  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Auth state będzie zaktualizowany przez listener
      return { success: true };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Wylogowywanie
  const signOut = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Auth state będzie zaktualizowany przez listener
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Rejestracja
  const signUp = async (email, password, username) => {
    try {
      setLoading(true);

      // Zarejestruj użytkownika
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Utwórz profil użytkownika
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username,
            email,
            role: "user",
            total_rides: 0,
            total_points: 0,
            streak_days: 0,
            active: true,
          },
        ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      // Auth state będzie zaktualizowany przez listener
      return { success: true };
    } catch (error) {
      console.error("Error signing up:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sprawdź, czy użytkownik jest administratorem
  const checkIfAdmin = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      return data?.role === "admin";
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        checkIfAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
