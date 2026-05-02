import React from "react";
import JobCard from "../components/JobCard.jsx";
import CandidatePortal from "../components/CandidatePortal.jsx";

export default function Login({
  candidateTab,
  setCandidateTab,
  allSkills,
  selectedSkills,
  toggleSkill,
  isSkillDropdownOpen,
  setIsSkillDropdownOpen,
  filteredJobs,
  myApplications,
  setSelectedJob,
  setIsModalOpen,
  isModalOpen,
  selectedJob,
  token,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "APPLIED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "REVIEWING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIRED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* THE SUB-NAVIGATION TAB */}
      <div className="flex gap-4 border-b border-slate-700 pb-4 mb-2">
        <button
          onClick={() => setCandidateTab("feed")}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${
            candidateTab === "feed"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          Live Job Feed
        </button>
        <button
          onClick={() => setCandidateTab("applications")}
          className={`px-5 py-2 rounded-lg font-medium transition-all ${
            candidateTab === "applications"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          My Applications
        </button>
      </div>

      {/* CONDITIONAL RENDER: FEED vs APPLICATIONS */}
      {candidateTab === "feed" ? (
        <>
          {/* 👇 MULTI-SELECT DROPDOwN FILTER 👇 */}
          {allSkills.length > 0 && (
            <div className="mb-6 relative z-30">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* The Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
                  >
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      ></path>
                    </svg>
                    Filter by AI Skills
                    {selectedSkills.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                        {selectedSkills.length}
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform ${isSkillDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </button>

                  {/* The Dropdown Menu */}
                  {isSkillDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Select Skills
                        </span>
                        {selectedSkills.length > 0 && (
                          <button
                            onClick={() => setSelectedSkills([])}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {allSkills.map((skill) => (
                          <label
                            key={skill}
                            className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors text-sm text-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSkills.includes(skill)}
                              onChange={() => toggleSkill(skill)}
                              className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 bg-slate-900 cursor-pointer"
                            />
                            {skill}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Selected Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm font-medium animate-in zoom-in duration-200"
                    >
                      {skill}
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="hover:text-blue-200 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* 👆 END MULTI-SELECT FILTER 👆 */}

          {/* RENDER THE FILTERED JOBS */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
              <p className="text-slate-400 text-lg">
                No open roles match all selected skills.
              </p>
              <button
                onClick={() => setSelectedSkills([])}
                className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => (
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

          {isModalOpen && selectedJob && (
            <CandidatePortal
              job={selectedJob}
              onClose={() => setIsModalOpen(false)}
              token={token}
            />
          )}
        </>
      ) : (
        // THE "MY APPLICATIONS" UI
        <div className="flex flex-col gap-4">
          {myApplications.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
              <p className="text-slate-400">
                You haven't applied to any jobs yet.
              </p>
              <button
                onClick={() => setCandidateTab("feed")}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
              >
                Browse open roles →
              </button>
            </div>
          ) : (
            myApplications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col gap-4 hover:border-slate-500 transition-colors"
              >
                {/* Top Row: Basic Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      {app.job.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {app.job.company}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* AI Match Score Badge */}
                    {app.aiMatchScore ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                          AI Match
                        </span>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold text-sm">
                          {app.aiMatchScore}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                          AI Match
                        </span>
                        <span className="text-sm text-slate-500 italic">
                          Processing...
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        Status
                      </span>
                      <span
                        className={`px-4 py-1 border rounded-full text-sm font-bold ${getStatusBadge(app.status)}`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 👇 NEW: PRODUCT EMPATHY & SKILL GAP ANALYSIS 👇 */}
                {app.status === "REJECTED" && (
                  <div className="mt-2 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="text-blue-400 mt-0.5">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-blue-400 mb-1">
                        AI Career Coach Insight
                      </h4>
                      <p className="text-sm text-slate-300">
                        While this role wasn't a perfect match, our AI noted a
                        strong foundation. To increase your match score for
                        similar roles, consider brushing up on your missing
                        skills.
                      </p>

                      {/* If your backend sends a skillGap array, map it here. If not, this is a great placeholder! */}
                      {app.skillGap && app.skillGap.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-slate-400 py-1">
                            Recommended Focus Areas:
                          </span>
                          {app.skillGap.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-slate-900 text-blue-300 border border-blue-500/20 rounded-md text-xs font-medium"
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
