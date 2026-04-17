import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const JobWorkspace = ({ job, token, onBack }) => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [job.id]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/jobs/${job.id}/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Sort by aiMatchScore
      const sortedApps = response.data.sort(
        (a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0),
      );
      setApplications(sortedApps);
    } catch (error) {
      toast.error("Failed to load candidates.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/applications/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Candidate status updated!");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to update status.");
      console.error("Status Update Error:", error);
    }
  };

  // 🚀 THE SECURE RESUME DOWNLOADER
  const handleViewResume = async (appId) => {
    const loadingToast = toast.loading("Decrypting and opening resume...");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/applications/${appId}/resume`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // CRITICAL: Tells Axios we are downloading a file, not JSON
        },
      );

      // Create a temporary local URL for the downloaded file
      const fileURL = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      // Open it in a new tab!
      window.open(fileURL, "_blank");
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error("Failed to load resume.", { id: loadingToast });
    }
  };

  const getScoreColor = (score) => {
    if (score == null)
      return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    if (score >= 80)
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (score >= 50)
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  return (
    <div className="w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white mb-4 text-sm flex items-center gap-2 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-100">{job.title}</h2>
          <p className="text-blue-400">{job.company}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-slate-100">
            {applications.length}
          </p>
          <p className="text-sm text-slate-400">Total Candidates</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm">
              <th className="pb-4 font-medium pl-4">Candidate</th>
              <th className="pb-4 font-medium text-center">AI Match Score</th>
              <th className="pb-4 font-medium text-center">Pipeline Status</th>
              <th className="pb-4 font-medium text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400">
                  Loading candidates...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-slate-400">
                  No applications yet.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors group"
                >
                  <td className="py-4 pl-4">
                    {/* The name and email will now render correctly! */}
                    <p className="font-semibold text-slate-200">
                      {app.candidate?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {app.candidate?.email || "No Email"}
                    </p>
                  </td>

                  <td className="py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(app.aiMatchScore)}`}
                    >
                      {/* Will now correctly say "Pending" if score is null */}
                      {app.aiMatchScore != null
                        ? `${app.aiMatchScore}%`
                        : "Pending"}
                    </span>
                  </td>

                  <td className="py-4 text-center">
                    <select
                      value={app.status || "APPLIED"}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="INTERVIEWING">Interviewing</option>
                      <option value="OFFERED">Offered</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>

                  <td className="py-4 text-right pr-4">
                    {/* The secure View Resume button */}
                    <button
                      onClick={() => handleViewResume(app.id)}
                      className="inline-block px-4 py-2 bg-slate-900 text-blue-400 hover:bg-blue-600 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      View Resume
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobWorkspace;
