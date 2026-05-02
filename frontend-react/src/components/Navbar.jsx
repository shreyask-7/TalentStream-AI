import React from "react";

export default function Navbar({
  token,
  notifications,
  setNotifications,
  showDropdown,
  setShowDropdown,
  currentUser,
  userRole,
  handleLogout,
}) {
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-700">
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 tracking-tight">
        TalentStream AI
      </h1>

      {token && (
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-slate-900">
                  {notifications.length}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-200">Notifications</h3>
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">
                      No new notifications.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                      >
                        <p className="text-sm text-slate-200">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          {getTimeAgo(notif.time)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-4 pl-6 border-l border-slate-700">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-200">
                {currentUser
                  ? currentUser.firstName
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : currentUser.username
                  : "Loading..."}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {userRole
                  ? userRole.replace("ROLE_", "").toLowerCase()
                  : "Loading..."}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-all border border-slate-700 hover:border-red-500"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
