import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import {
  Bike,
  BarChart2,
  Compass,
  Trophy,
  CheckCircle,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import NotificationsPopover from "./NotificationsPopover";

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
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setIsAdmin(data.role === "admin");
      } catch (err) {
        console.error("Błąd sprawdzania uprawnień:", err);
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
      navigate("/login");
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    }
  };

  // Nie pokazuj nawigacji na stronach logowania i rejestracji
  if (["/login", "/register", "/"].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-indigo-900 bg-opacity-90 border-b-2 border-purple-500 shadow-lg shadow-purple-500/20">
      <div className="container mx-auto flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-xl font-bold text-amber-300 pixelated flex items-center"
        >
          <Bike className="mr-2" />
          <span>BIKE TRACKER</span>
        </Link>

        <button
          className="md:hidden text-white hover:text-amber-300 transition"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={`fixed md:static top-16 left-0 right-0 bg-indigo-900 bg-opacity-95 md:bg-opacity-0 p-4 md:p-0 ${
            isMenuOpen ? "block" : "hidden"
          } md:block`}
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-5">
            <NavbarLink
              to="/dashboard"
              label="DASHBOARD"
              icon={<BarChart2 size={18} />}
              isActive={location.pathname === "/dashboard"}
              onClick={() => setIsMenuOpen(false)}
            />

            <NavbarLink
              to="/add-ride"
              label="DODAJ DOJAZD"
              icon={<Bike size={18} />}
              isActive={location.pathname === "/add-ride"}
              onClick={() => setIsMenuOpen(false)}
            />

            <NavbarLink
              to="/statistics"
              label="STATYSTYKI"
              icon={<BarChart2 size={18} />}
              isActive={location.pathname === "/statistics"}
              onClick={() => setIsMenuOpen(false)}
            />

            <NavbarLink
              to="/achievements"
              label="OSIĄGNIĘCIA"
              icon={<Trophy size={18} />}
              isActive={location.pathname === "/achievements"}
              onClick={() => setIsMenuOpen(false)}
            />

            <NavbarLink
              to="/challenges"
              label="WYZWANIA"
              icon={<Compass size={18} />}
              isActive={location.pathname === "/challenges"}
              onClick={() => setIsMenuOpen(false)}
            />

            <NavbarLink
              to="/verification"
              label="WERYFIKACJA"
              icon={<CheckCircle size={18} />}
              isActive={location.pathname === "/verification"}
              onClick={() => setIsMenuOpen(false)}
            />

            {isAdmin && (
              <NavbarLink
                to="/user-management"
                label="UŻYTKOWNICY"
                icon={<Users size={18} />}
                isActive={location.pathname === "/user-management"}
                onClick={() => setIsMenuOpen(false)}
              />
            )}

            <div className="flex items-center space-x-2">
              <NotificationsPopover />
              <button
                onClick={handleSignOut}
                className="flex items-center text-red-400 hover:text-red-300 transition px-3 py-1 pixelated text-sm"
              >
                <LogOut size={18} className="mr-1" />
                <span>WYLOGUJ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Komponent dla linków nawigacyjnych
const NavbarLink = ({ to, label, icon, isActive, onClick }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-1 rounded transition pixelated text-sm
        ${
          isActive
            ? "text-amber-300 bg-indigo-800"
            : "text-white hover:text-amber-300"
        }`}
      onClick={onClick}
    >
      {icon && <span className="mr-1">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
};

export default Navbar;
