import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// --- API Layer ---
import { fetchJobApplications } from "../api/jobs";
import {
  updateApplicationStatus,
  submitApplicationFeedback,
  downloadResume,
} from "../api/applications";

const JobWorkspace = ({ job, token, onBack }) => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [job.id]);

  const fetchApplications = async () => {
    try {
      const data = await fetchJobApplications(job.id);
      // Sort by aiMatchScore
      const sortedApps = data.sort(
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
      await updateApplicationStatus(appId, newStatus);
      toast.success("Candidate status updated!");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to update status.");
      console.error("Status Update Error:", error);
    }
  };

  const submitFeedback = async (appId, feedbackValue) => {
    setApplications((prevApps) =>
      prevApps.map((app) =>
        app.id === appId ? { ...app, aiFeedback: feedbackValue } : app,
      ),
    );
    try {
      await submitApplicationFeedback(appId, feedbackValue);
      toast.success("AI feedback logged! 🧠");
    } catch (error) {
      toast.error("Failed to log feedback.");
    }
  };

  // 🚀 THE SECURE RESUME DOWNLOADER
  const handleViewResume = async (appId) => {
    const loadingToast = toast.loading("Decrypting and opening resume...");
    try {
      const blobData = await downloadResume(appId);

      // Create a temporary local URL for the downloaded file
      const fileURL = window.URL.createObjectURL(
        new Blob([blobData], { type: "application/pdf" }),
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
              <th className="pb-4 font-medium text-center w-40">
                AI Match Score
              </th>
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
                    <p className="font-semibold text-slate-200">
                      {app.user?.firstName
                        ? `${app.user.firstName} ${app.user.lastName}`
                        : app.user?.username || "Unknown Candidate"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {app.contactEmail || "No Email"}
                    </p>
                  </td>

                  <td className="py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(app.aiMatchScore)}`}
                      >
                        {app.aiMatchScore != null
                          ? `${app.aiMatchScore}%`
                          : "Pending"}
                      </span>

                      {/* AI Feedback Thumbs */}
                      {app.aiMatchScore != null && (
                        <div className="flex items-center gap-2 bg-slate-900/50 rounded-full p-1 border border-slate-700">
                          <button
                            title="Accurate Match"
                            onClick={() => submitFeedback(app.id, 1)}
                            className={`p-1 rounded-full transition-all ${app.aiFeedback === 1 ? "bg-green-500/20 text-green-400 scale-110" : "text-slate-500 hover:text-green-400 hover:bg-slate-700"}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"
                              ></path>
                            </svg>
                          </button>
                          <div className="w-px h-4 bg-slate-700"></div>
                          <button
                            title="Inaccurate Match"
                            onClick={() => submitFeedback(app.id, -1)}
                            className={`p-1 rounded-full transition-all ${app.aiFeedback === -1 ? "bg-red-500/20 text-red-400 scale-110" : "text-slate-500 hover:text-red-400 hover:bg-slate-700"}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.514"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
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
