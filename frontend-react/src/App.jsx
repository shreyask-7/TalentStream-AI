import { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

import JobCard from "./components/JobCard.jsx";
import CandidatePortal from "./components/CandidatePortal.jsx";
import RecruiterDashboard from "./components/RecruiterDashboard.jsx";

function App() {
  const [token, setToken] = useState(localStorage.getItem("jwt_token") || "");
  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
    role: "ROLE_CANDIDATE",
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });
  const [activeView, setActiveView] = useState("candidate");
  const [userRole, setUserRole] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        authForm,
      );
      const jwt = response.data.token || response.data;
      setToken(jwt);
      localStorage.setItem("jwt_token", jwt);

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
    localStorage.removeItem("jwt_token");
    setJobs([]);
    toast.success("Logged out successfully");
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/jobs");
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchJobs();
    const eventSource = new EventSource(
      "http://localhost:8000/api/jobs/stream",
    );
    eventSource.addEventListener("job-updated", (event) => {
      const updatedJob = JSON.parse(event.data);
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
      );
    });
    return () => eventSource.close();
  }, [token]);

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
      fetchJobs();
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
        fetchJobs();
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
          <div className="flex gap-4">
            {userRole === "ROLE_CANDIDATE" && (
              <button
                onClick={() => setActiveView("candidate")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${activeView === "candidate" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                Candidate Portal
              </button>
            )}

            {userRole === "ROLE_RECRUITER" && (
              <button
                onClick={() => setActiveView("recruiter")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${activeView === "recruiter" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                Recruiter View
              </button>
            )}

            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-all border border-red-500/20 hover:border-red-500"
            >
              Log Out
            </button>
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
            <input
              type="text"
              name="username"
              value={authForm.username}
              onChange={handleAuthChange}
              placeholder="Username"
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
            />
          )}
        </div>
      ) : (
        // 🚀 RECRUITER VIEW
        <div className="flex flex-col gap-10 items-center max-w-7xl mx-auto">
          {/* Top: The Analytics Dashboard */}
          <div className="w-full">
            <RecruiterDashboard token={token} />
          </div>

          {/* Bottom: Split View for Posting and Managing Jobs */}
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
                    <JobCard key={job.id} job={job} onDelete={handleDelete} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
