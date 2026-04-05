import { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "./components/JobCard.jsx";

function App() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: "", company: "", description: "" });

  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/jobs");
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/jobs")
      .then((response) => response.json())
      .then((data) => setJobs(data));

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
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/jobs", form);
      setForm({ title: "", company: "", description: "" });
      fetchJobs();
    } catch (error) {
      alert("Check CORS or Backend Status!");
    }
  };

  const handleDelete = async (id) => {
    console.log("Attempting to delete Job ID:", id);
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`http://localhost:8000/api/jobs/${id}`);
        fetchJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Delete failed!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Left Column: Post Job Form --- */}
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
                placeholder="Description"
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

        {/* --- Right Column: Job Feed --- */}
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
  );
}

export default App;
