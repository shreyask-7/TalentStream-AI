import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CandidatePortal = ({ job, onClose, token }) => {
  const [formData, setFormData] = useState({
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
    submitData.append("jobId", job.id);
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
            Authorization: `Bearer ${token}`, // Assuming token is stored in localStorage after login
          },
        },
      );

      toast.success(
        `✅ Success! Application ID: ${response.data.id || "Submitted"}`,
        {
          id: loadingToast, // Replaces the loading toast with success
        },
      );
      onClose(); // Close the modal after successful submission
      // Reset form
      setFormData({ name: "", email: "", resume: null });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* THE MODAL BOX */}
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md relative">
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
          Apply Now
        </h2>

        {/* Showing them what they are applying for contextually */}
        <div className="mb-6 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <p className="text-sm text-slate-400">Position</p>
          <p className="text-blue-400 font-semibold">{job.title}</p>
          <p className="text-xs text-slate-500 mt-1">{job.company}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Full Name
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
              Email Address
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
              Resume (PDF)
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
            className={`w-full py-3 mt-2 font-bold rounded-lg shadow-lg transition-all ${
              isLoading
                ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30 active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CandidatePortal;
