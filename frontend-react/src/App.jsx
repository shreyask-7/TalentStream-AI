import { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

import JobCard from "./components/JobCard.jsx";
import CandidatePortal from "./components/CandidatePortal.jsx";
import JobWorkspace from "./components/JobWorkspace.jsx";

function App() {
  const [token, setToken] = useState(sessionStorage.getItem("jwt_token") || "");
  const [authForm, setAuthForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "ROLE_CANDIDATE",
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });
  const [activeView, setActiveView] = useState("candidate");
  const [activeRecruiterJob, setActiveRecruiterJob] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        authForm,
      );
      const jwt = response.data.token || response.data;
      setToken(jwt);
      sessionStorage.setItem("jwt_token", jwt);

      const decoded = jwtDecode(jwt);
      setUserRole(decoded.role);
      setActiveView(
        decoded.role === "ROLE_RECRUITER" ? "recruiter" : "candidate",
      );

      toast.success("Welcome back to TalentStream!");
    } catch (error) {
      toast.error("Login failed! Check your credentials.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/register",
        authForm,
      );

      if (response.data === "User registered successfully!") {
        toast.success(response.data);
        setIsLoginMode(true);
      } else {
        toast.error(response.data);
      }
    } catch (error) {
      toast.error("Registration failed! Check console.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    setToken("");
    sessionStorage.removeItem("jwt_token");
    setJobs([]);
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    if (!token) return;

    let currentRole = userRole;
    if (!currentRole) {
      try {
        const decoded = jwtDecode(token);
        currentRole = decoded.role;
        setUserRole(currentRole);
        setActiveView(
          currentRole === "ROLE_RECRUITER" ? "recruiter" : "candidate",
        );
      } catch (error) {
        handleLogout();
        return;
      }
    }

    const fetchInitialJobs = async () => {
      try {
        const endpoint =
          currentRole === "ROLE_RECRUITER"
            ? "http://localhost:8000/api/jobs/my-jobs"
            : "http://localhost:8000/api/jobs";
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching initial jobs:", error);
        setJobs([]);
      }
    };

    fetchInitialJobs();

    const eventSource = new EventSource(
      "http://localhost:8000/api/jobs/stream",
    );
    eventSource.addEventListener("job-updated", (event) => {
      try {
        const updatedJob = JSON.parse(event.data);
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
        );
      } catch (error) {
        console.error("SSE Parse Error:", error);
      }
    });
    return () => eventSource.close();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    fetchProfile();

    const eventSource = new EventSource(
      `http://localhost:8000/api/jobs/notifications/stream?token=${token}`,
    );

    const addNotification = (message, type) => {
      const newNotif = { id: Date.now(), message, type, time: new Date() };
      setNotifications((prev) => [newNotif, ...prev]);
    };

    eventSource.addEventListener("status-updated", (event) => {
      try {
        const data = JSON.parse(event.data);
        addNotification(data.message, "status");
        toast.success(data.message, {
          duration: 6000,
          icon: "🎉",
          style: {
            background: "#10b981",
            color: "#fff",
            fontWeight: "bold",
          },
        });
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    });

    eventSource.addEventListener("new-application", (event) => {
      try {
        const data = JSON.parse(event.data);
        addNotification(data.message, "application");
        toast.success(data.message, {
          duration: 8000,
          icon: "🚀",
          style: {
            background: "#8b5cf6",
            color: "#fff",
            fontWeight: "bold",
          },
        });
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    });

    return () => eventSource.close();
  }, [token, userRole]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleAuthChange = (e) =>
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/jobs", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ title: "", company: "", description: "" });

      // Refresh the feed
      const endpoint =
        userRole === "ROLE_RECRUITER" ? "/api/jobs/my-jobs" : "/api/jobs";
      const response = await axios.get(`http://localhost:8000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(Array.isArray(response.data) ? response.data : []);

      toast.success("Job posted successfully! 🚀");
    } catch (error) {
      toast.error("Failed to post job.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`http://localhost:8000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(jobs.filter((job) => job.id !== id)); // Optimistic UI update
        toast.success("Job deleted.");
      } catch (error) {
        toast.error("Error deleting job.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "#1e293b", color: "#fff" } }}
      />

      {/* 1. THE NAVIGATION BAR */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-700">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 tracking-tight">
          TalentStream AI
        </h1>

        {token && (
          <div className="flex items-center gap-6">
            {/* 🔔 THE NOTIFICATION BELL */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-all"
              >
                {/* Simple SVG Bell Icon */}
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

                {/* Notification Badge/Counter */}
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-slate-900">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* 📜 THE NOTIFICATION DROPDOWN */}
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

            {/* 👤 THE USER PROFILE & LOGOUT */}
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

      {/* 2. CONDITIONAL RENDERING */}
      {!token ? (
        // AUTH FORM
        <div className="max-w-md mx-auto mt-20 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50">
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h2>

          <form
            onSubmit={isLoginMode ? handleLogin : handleRegister}
            className="flex flex-col gap-4"
          >
            {!isLoginMode && (
              <>
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="firstName"
                    value={authForm.firstName}
                    onChange={handleAuthChange}
                    placeholder="First Name"
                    className="w-1/2 p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={authForm.lastName}
                    onChange={handleAuthChange}
                    placeholder="Last Name"
                    className="w-1/2 p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                    required
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="Email Address"
                  className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                  required
                />
              </>
            )}
            <input
              type="text"
              name="username"
              value={authForm.username}
              onChange={handleAuthChange}
              placeholder={
                isLoginMode ? "Username or Email" : "Choose a Username"
              }
              className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
              required
            />
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Password"
              className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
              required
            />

            {!isLoginMode && (
              <select
                name="role"
                value={authForm.role}
                onChange={handleAuthChange}
                className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer text-slate-200"
              >
                <option value="ROLE_CANDIDATE">I am a Candidate</option>
                <option value="ROLE_RECRUITER">I am a Recruiter</option>
              </select>
            )}

            <button
              type="submit"
              className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isLoginMode ? "Login to TalentStream" : "Complete Registration"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              {isLoginMode
                ? "Need an account? Sign up here."
                : "Already have an account? Log in."}
            </button>
          </div>
        </div>
      ) : activeView === "candidate" ? (
        // 🚀 CANDIDATE VIEW
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
            Live Job Feed
          </h2>

          {jobs.length === 0 ? (
            <p className="text-slate-400 text-center py-10">
              No jobs available right now. Check back later!
            </p>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApply={(clickedJob) => {
                  setSelectedJob(clickedJob);
                  setIsModalOpen(true);
                }}
              />
            ))
          )}

          {/* Render the Modal Component */}
          {isModalOpen && selectedJob && (
            <CandidatePortal
              job={selectedJob}
              onClose={() => setIsModalOpen(false)}
              token={token}
            />
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {activeRecruiterJob ? (
            // DETAIL VIEW: The Job Workspace
            <JobWorkspace
              job={activeRecruiterJob}
              token={token}
              onBack={() => setActiveRecruiterJob(null)}
            />
          ) : (
            // MASTER VIEW: The Dashboard & Job List
            <div className="flex flex-col gap-10 items-center">
              {/* Split View for Posting and Managing Jobs */}
              <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Side: Post a Job Form */}
                <div className="w-full lg:w-1/3 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 sticky top-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                    Post a New Role
                  </h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                      name="title"
                      placeholder="Job Title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200"
                      required
                    />
                    <input
                      name="company"
                      placeholder="Company Name"
                      value={form.company}
                      onChange={handleChange}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200"
                      required
                    />
                    <textarea
                      name="description"
                      placeholder="Job Description..."
                      value={form.description}
                      onChange={handleChange}
                      className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 min-h-[150px]"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all active:scale-[0.98]"
                    >
                      Publish Job Post 🚀
                    </button>
                  </form>
                </div>

                {/* Right Side: Manage Active Jobs */}
                <div className="w-full lg:w-2/3">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    Manage Active Postings
                  </h2>
                  <div className="flex flex-col gap-4">
                    {jobs.length === 0 ? (
                      <p className="text-slate-400">
                        You haven't posted any jobs yet.
                      </p>
                    ) : (
                      jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onDelete={handleDelete}
                          // 👈 New Prop to trigger the workspace!
                          onManage={(clickedJob) =>
                            setActiveRecruiterJob(clickedJob)
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
