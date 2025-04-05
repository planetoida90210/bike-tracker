// src/components/NotificationsPopover.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { notificationServices } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Bell, X, Award, Trophy, Calendar, CheckCircle } from "lucide-react";

const NotificationsPopover = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const popoverRef = useRef(null);

  // Pobierz powiadomienia - używamy useCallback żeby zapobiec tworzeniu nowej referencji przy każdym renderowaniu
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notificationsData = await notificationServices.getUserNotifications(
        user.id
      );

      setNotifications(notificationsData || []);
      setUnreadCount(notificationsData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Odśwież powiadomienia co minutę
    const intervalId = setInterval(fetchNotifications, 60000);

    // Dodaj obsługę kliknięć poza popoverem
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchNotifications]); // Dodajemy fetchNotifications do zależności

  // Oznacz powiadomienie jako przeczytane
  const markAsRead = async (notificationId) => {
    try {
      await notificationServices.markNotificationAsRead(notificationId);

      // Aktualizuj lokalny stan
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Błąd oznaczania powiadomienia:", error);
    }
  };

  // Wybierz ikonę na podstawie typu powiadomienia
  const getNotificationIcon = (type) => {
    switch (type) {
      case "achievement":
        return <Award size={18} className="text-amber-300" />;
      case "challenge":
        return <Trophy size={18} className="text-purple-400" />;
      case "verification":
        return <CheckCircle size={18} className="text-green-400" />;
      default:
        return <Calendar size={18} className="text-blue-400" />;
    }
  };

  // Formatuj datę
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min temu`;
    } else if (diffHours < 24) {
      return `${diffHours} godz. temu`;
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return date.toLocaleDateString("pl-PL");
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-amber-300 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-indigo-800 border-2 border-purple-500 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-purple-700 flex justify-between items-center">
            <h3 className="font-bold text-white pixelated">POWIADOMIENIA</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-300"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Brak powiadomień
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-purple-700 hover:bg-indigo-700 transition ${
                    notification.read ? "" : "bg-indigo-700 bg-opacity-50"
                  }`}
                  onClick={() =>
                    !notification.read && markAsRead(notification.id)
                  }
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-white">
                        {notification.title}
                      </div>
                      <div className="text-xs text-teal-300 mt-1">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatNotificationDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPopover;
