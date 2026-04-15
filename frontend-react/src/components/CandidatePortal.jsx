import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CandidatePortal = () => {
  const [formData, setFormData] = useState({
    jobId: "",
    name: "",
    email: "",
    resume: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resume) {
      toast.error("⚠️ Please attach a resume PDF.");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Uploading and analyzing...");

    const submitData = new FormData();
    submitData.append("jobId", formData.jobId);
    submitData.append("name", formData.name);
    submitData.append("email", formData.email);
    submitData.append("resume", formData.resume);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/applications",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success(
        `✅ Success! Application ID: ${response.data.id || "Submitted"}`,
        {
          id: loadingToast, // Replaces the loading toast with success
        },
      );

      // Reset form
      setFormData({ jobId: "", name: "", email: "", resume: null });
      document.getElementById("resume-upload").value = "";
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("❌ Failed to submit application. Check console.", {
        id: loadingToast, // Replaces the loading toast with error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 sticky top-8">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        Apply for a Role
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Job ID:
          </label>
          <input
            type="number"
            name="jobId"
            value={formData.jobId}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Full Name:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Email:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Resume (PDF only):
          </label>
          <input
            type="file"
            id="resume-upload"
            accept=".pdf"
            onChange={handleFileChange}
            required
            className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-all cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 mt-4 font-bold rounded-lg shadow-lg transition-all active:scale-[0.98] ${
            isLoading
              ? "bg-slate-600 text-slate-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30"
          }`}
        >
          {isLoading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default CandidatePortal;
