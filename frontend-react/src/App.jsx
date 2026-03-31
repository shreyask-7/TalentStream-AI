import { useState } from "react";
import axios from "axios";

function App() {
  const [job, setJob] = useState({
    title: "",
    company: "",
    description: "",
  });

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8080/api/jobs", job);
      alert("Job Posted Successfully! ID: " + response.data.id);
      setJob({ title: "", company: "", description: "" });
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Failed to connect to backend. Check CORS!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-blue-400">
          Post a New Job
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">
              Job Title
            </label>
            <input
              name="title"
              value={job.title}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Software Engineer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Company
            </label>
            <input
              name="company"
              value={job.company}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="e.g. TalentStream AI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400">
              Description
            </label>
            <textarea
              name="description"
              value={job.description}
              onChange={handleChange}
              className="w-full mt-1 p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500 h-32"
              placeholder="Describe the role..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-bold transition duration-200"
          >
            Post Job 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
