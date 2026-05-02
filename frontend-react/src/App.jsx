import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";

// --- API Layer ---
import { loginUser, registerUser, getProfile } from "./api/auth";
import { fetchJobs, fetchMyJobs, createJob, deleteJob } from "./api/jobs";
import { fetchMyApplications, fetchRecruiterAnalytics } from "./api/analytics";

// --- Components & Pages ---
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";

function App() {
  // 1. Core Auth & User State
  const [token, setToken] = useState(sessionStorage.getItem("jwt_token") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeView, setActiveView] = useState("candidate");

  // 2. Auth Form State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "ROLE_CANDIDATE",
  });

  // 3. Candidate State
  const [candidateTab, setCandidateTab] = useState("feed");
  const [myApplications, setMyApplications] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // 4. Recruiter State
  const [recruiterTab, setRecruiterTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });
  const [activeRecruiterJob, setActiveRecruiterJob] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // 5. Global UI State
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // --- Handlers ---
  const handleAuthChange = (e) =>
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(authForm);
      const jwt = response.token || response;
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
      const response = await registerUser(authForm);
      if (response === "User registered successfully!") {
        toast.success(response);
        setIsLoginMode(true);
      } else {
        toast.error(response);
      }
    } catch (error) {
      toast.error("Registration failed! Check console.");
    }
  };

  const handleLogout = () => {
    setToken("");
    sessionStorage.removeItem("jwt_token");
    setJobs([]);
    toast.success("Logged out successfully");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createJob(form);
      setForm({ title: "", company: "", description: "" });

      const updatedJobs =
        userRole === "ROLE_RECRUITER" ? await fetchMyJobs() : await fetchJobs();
      setJobs(Array.isArray(updatedJobs) ? updatedJobs : []);
      toast.success("Job posted successfully! 🚀");
    } catch (error) {
      toast.error("Failed to post job.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await deleteJob(id);
        setJobs(jobs.filter((job) => job.id !== id));
        toast.success("Job deleted.");
      } catch (error) {
        toast.error("Error deleting job.");
      }
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  // --- Effects ---
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

    const loadInitialData = async () => {
      try {
        const [profileData, jobsData] = await Promise.all([
          getProfile(),
          currentRole === "ROLE_RECRUITER" ? fetchMyJobs() : fetchJobs(),
        ]);
        setCurrentUser(profileData);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (error) {
        console.error("Error loading initial data", error);
      }
    };
    loadInitialData();

    // SSE Event Listeners
    const jobEventSource = new EventSource(
      "http://localhost:8000/api/jobs/stream",
    );
    jobEventSource.addEventListener("job-updated", (event) => {
      try {
        const updatedJob = JSON.parse(event.data);
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
        );
      } catch (error) {
        console.error("SSE Parse Error", error);
      }
    });

    const notifEventSource = new EventSource(
      `http://localhost:8000/api/jobs/notifications/stream?token=${token}`,
    );
    const addNotification = (message) =>
      setNotifications((prev) => [
        { id: Date.now(), message, time: new Date() },
        ...prev,
      ]);

    notifEventSource.addEventListener("status-updated", (event) => {
      const data = JSON.parse(event.data);
      addNotification(data.message);
      toast.success(data.message, {
        duration: 6000,
        icon: "🎉",
        style: { background: "#10b981", color: "#fff" },
      });
    });

    notifEventSource.addEventListener("new-application", (event) => {
      const data = JSON.parse(event.data);
      addNotification(data.message);
      toast.success(data.message, {
        duration: 8000,
        icon: "🚀",
        style: { background: "#8b5cf6", color: "#fff" },
      });
    });

    return () => {
      jobEventSource.close();
      notifEventSource.close();
    };
  }, [token]);

  useEffect(() => {
    if (
      token &&
      userRole === "ROLE_CANDIDATE" &&
      candidateTab === "applications"
    ) {
      fetchMyApplications()
        .then(setMyApplications)
        .catch(() => toast.error("Failed to load applications."));
    }
  }, [token, userRole, candidateTab]);

  useEffect(() => {
    if (
      token &&
      userRole === "ROLE_RECRUITER" &&
      recruiterTab === "analytics"
    ) {
      fetchRecruiterAnalytics()
        .then(setAnalyticsData)
        .catch(() => toast.error("Failed to load analytics."));
    }
  }, [token, userRole, recruiterTab]);

  // --- Derived State for Candidate Filtering ---
  const allSkills = Array.from(
    new Set(
      jobs.flatMap((job) => {
        if (!job.skills) return [];
        if (Array.isArray(job.skills)) return job.skills;
        if (typeof job.skills === "string")
          return job.skills.split(",").map((s) => s.trim());
        return [];
      }),
    ),
  )
    .filter(Boolean)
    .sort();

  const filteredJobs =
    selectedSkills.length === 0
      ? jobs
      : jobs.filter((job) => {
          const jobSkills = Array.isArray(job.skills)
            ? job.skills
            : typeof job.skills === "string"
              ? job.skills.split(",").map((s) => s.trim())
              : [];
          return selectedSkills.every((selected) =>
            jobSkills.includes(selected),
          );
        });

  // --- Rendering ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "#1e293b", color: "#fff" } }}
      />

      <Navbar
        token={token}
        notifications={notifications}
        setNotifications={setNotifications}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        currentUser={currentUser}
        userRole={userRole}
        handleLogout={handleLogout}
      />

      {!token ? (
        <Login
          isLoginMode={isLoginMode}
          setIsLoginMode={setIsLoginMode}
          authForm={authForm}
          handleAuthChange={handleAuthChange}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
        />
      ) : activeView === "candidate" ? (
        <CandidateDashboard
          candidateTab={candidateTab}
          setCandidateTab={setCandidateTab}
          allSkills={allSkills}
          selectedSkills={selectedSkills}
          toggleSkill={toggleSkill}
          isSkillDropdownOpen={isSkillDropdownOpen}
          setIsSkillDropdownOpen={setIsSkillDropdownOpen}
          filteredJobs={filteredJobs}
          myApplications={myApplications}
          setSelectedJob={setSelectedJob}
          setIsModalOpen={setIsModalOpen}
          isModalOpen={isModalOpen}
          selectedJob={selectedJob}
          token={token}
        />
      ) : (
        <RecruiterDashboard
          recruiterTab={recruiterTab}
          setRecruiterTab={setRecruiterTab}
          activeRecruiterJob={activeRecruiterJob}
          setActiveRecruiterJob={setActiveRecruiterJob}
          form={form}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          jobs={jobs}
          handleDelete={handleDelete}
          analyticsData={analyticsData}
          token={token}
        />
      )}
    </div>
  );
}

export default App;
