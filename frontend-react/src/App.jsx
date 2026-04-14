import { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "./components/JobCard.jsx";
import CandidatePortal from "./components/CandidatePortal.jsx";
import RecruiterDashboard from "./components/RecruiterDashboard.jsx";
import { jwtDecode } from "jwt-decode";

function App() {
  const [token, setToken] = useState(localStorage.getItem("jwt_token") || "");
  const [authForm, setAuthForm] = useState({
    username: "user",
    password: "password",
    role: "ROLE_CANDIDATE",
  });
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });
  const [activeView, setActiveView] = useState("candidate"); // 'candidate' or 'recruiter'
  const [userRole, setUserRole] = useState(null);

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

      if (decoded.role === "ROLE_RECRUITER") {
        setActiveView("recruiter");
      } else {
        setActiveView("candidate");
      }
    } catch (error) {
      alert("Login failed! Check your credentials or backend status.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/register",
        authForm,
      );
      alert(response.data);
      if (response.data === "User registered successfully!") {
        setIsLoginMode(true);
      }
    } catch (error) {
      alert("Registration failed! Check console or ensure backend is running.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("jwt_token");
    setJobs([]);
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
      console.log("Real-time update received!", updatedJob);
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
      );
    });

    return () => eventSource.close();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/jobs", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ title: "", company: "", description: "" });
      fetchJobs();
    } catch (error) {
      console.error(error);
      alert("Failed to post job! Check console.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`http://localhost:8000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        color: "#fff",
        backgroundColor: "#0f172a",
        minHeight: "100vh",
      }}
    >
      {/* 1. THE NAVIGATION BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          borderBottom: "1px solid #334155",
          paddingBottom: "20px",
        }}
      >
        <h1 style={{ color: "#a855f7", margin: 0 }}>
          TalentStream AI Dashboard
        </h1>

        {token && (
          <div style={{ display: "flex", gap: "15px" }}>
            {userRole === "ROLE_CANDIDATE" && (
              <button
                onClick={() => setActiveView("candidate")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Candidate Portal
              </button>
            )}

            {userRole === "ROLE_RECRUITER" && (
              <button
                onClick={() => setActiveView("recruiter")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Recruiter View
              </button>
            )}

            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* 2. CONDITIONAL RENDERING (The Magic) */}
      {!token ? (
        // SHOW AUTH FORM IF NOT AUTHENTICATED
        <div
          style={{
            maxWidth: "400px",
            margin: "100px auto",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <h2 style={{ textAlign: "center" }}>
            {isLoginMode ? "Login to TalentStream" : "Register New Account"}
          </h2>

          <form
            onSubmit={isLoginMode ? handleLogin : handleRegister}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <input
              type="text"
              name="username"
              value={authForm.username}
              onChange={handleAuthChange}
              placeholder="Username"
              style={{ padding: "10px" }}
              required
            />
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Password"
              style={{ padding: "10px" }}
              required
            />

            {!isLoginMode && (
              <select
                name="role"
                value={authForm.role}
                onChange={handleAuthChange}
                style={{
                  padding: "10px",
                  backgroundColor: "#334155",
                  color: "white",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ROLE_CANDIDATE">I am a Candidate</option>
                <option value="ROLE_RECRUITER">I am a Recruiter</option>
              </select>
            )}

            <button
              type="submit"
              style={{
                padding: "10px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              {isLoginMode ? "Login" : "Register"}
            </button>
          </form>

          {/* The Toggle Switch */}
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{
              background: "none",
              border: "none",
              color: "#a855f7",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isLoginMode
              ? "Need an account? Register here."
              : "Already have an account? Login here."}
          </button>
        </div>
      ) : activeView === "candidate" ? (
        // SHOW CANDIDATE STUFF (Portal + Job List)
        <div
          style={{
            display: "flex",
            gap: "40px",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, maxWidth: "500px" }}>
            <CandidatePortal />
          </div>
          <div style={{ flex: 1, maxWidth: "600px" }}>
            <h2>Available Positions</h2>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ) : (
        // SHOW RECRUITER STUFF (Dashboard + Job Posting)
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "900px" }}>
            <RecruiterDashboard token={token} />
          </div>

          {/* Your Post Job Form Container */}
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#1e293b",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h2>Post a New Job</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <input
                name="title"
                placeholder="Job Title"
                value={form.title}
                onChange={handleChange}
                style={{ padding: "10px" }}
              />
              <input
                name="company"
                placeholder="Company"
                value={form.company}
                onChange={handleChange}
                style={{ padding: "10px" }}
              />
              <textarea
                name="description"
                placeholder="Job Description"
                value={form.description}
                onChange={handleChange}
                style={{ padding: "10px", minHeight: "100px" }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                Post Job 🚀
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
