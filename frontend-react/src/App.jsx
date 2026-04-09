import { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "./components/JobCard.jsx";

function App() {
  const [token, setToken] = useState(localStorage.getItem("jwt_token") || "");
  const [authForm, setAuthForm] = useState({
    username: "user",
    password: "password",
  });

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });

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
    } catch (error) {
      alert("Login failed! Check your credentials or backend status.");
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

    fetch();

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

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-96 border border-gray-700">
          <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
            TalentStream Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              name="username"
              value={authForm.username}
              onChange={handleAuthChange}
              placeholder="Username"
              className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
              required
            />
            <input
              name="password"
              type="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Password"
              className="w-full p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500 outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold text-white transition"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            TalentStream AI Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold transition"
          >
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Post Job Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">
                Post a Job
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Job Title"
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  required
                />
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company"
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  required
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tricky Job Description without buzzwords..."
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 h-32 focus:border-blue-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition"
                >
                  Post Job 🚀
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Job Feed */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-gray-300">
              Live Job Feed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onDelete={handleDelete} />
              ))}
            </div>
            {jobs.length === 0 && (
              <p className="text-gray-500 italic">No jobs posted yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
