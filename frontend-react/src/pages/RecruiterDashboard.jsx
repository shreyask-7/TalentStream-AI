import React from "react";
// 👇 1. We must import all the Recharts components! 👇
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// 👇 2. We must import the nested components! 👇
import JobWorkspace from "../components/JobWorkspace";
import JobCard from "../components/JobCard";

// 👇 3. Renamed from Login to RecruiterDashboard 👇
export default function RecruiterDashboard({
  recruiterTab,
  setRecruiterTab,
  activeRecruiterJob,
  setActiveRecruiterJob,
  form,
  handleChange,
  handleSubmit,
  jobs,
  handleDelete,
  analyticsData,
  token,
}) {
  return (
    <div className="max-w-7xl mx-auto">
      {activeRecruiterJob ? (
        <JobWorkspace
          job={activeRecruiterJob}
          token={token}
          onBack={() => setActiveRecruiterJob(null)}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {/* 👇 RECRUITER SUB-NAVIGATION 👇 */}
          <div className="flex gap-4 border-b border-slate-700 pb-4 mb-2">
            <button
              onClick={() => setRecruiterTab("jobs")}
              className={`px-5 py-2 rounded-lg font-medium transition-all ${
                recruiterTab === "jobs"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Manage Postings
            </button>
            <button
              onClick={() => setRecruiterTab("analytics")}
              className={`px-5 py-2 rounded-lg font-medium transition-all ${
                recruiterTab === "analytics"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Analytics Dashboard
            </button>
          </div>

          {/* CONDITIONAL RENDER: JOBS vs ANALYTICS */}
          {recruiterTab === "jobs" ? (
            // MASTER VIEW: The Dashboard & Job List
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Side: Post a Job Form */}
              <div className="w-full lg:w-1/3 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50 sticky top-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                  Post a New Role
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    name="title"
                    placeholder="Job Title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200"
                    required
                  />
                  <input
                    name="company"
                    placeholder="Company Name"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200"
                    required
                  />
                  <textarea
                    name="description"
                    placeholder="Job Description..."
                    value={form.description}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-200 min-h-[150px]"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg transition-all active:scale-[0.98]"
                  >
                    Publish Job Post 🚀
                  </button>
                </form>
              </div>

              {/* Right Side: Manage Active Jobs */}
              <div className="w-full lg:w-2/3">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Manage Active Postings
                </h2>
                <div className="flex flex-col gap-4">
                  {jobs.length === 0 ? (
                    <p className="text-slate-400">
                      You haven't posted any jobs yet.
                    </p>
                  ) : (
                    jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onDelete={handleDelete}
                        onManage={(clickedJob) =>
                          setActiveRecruiterJob(clickedJob)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // 👇 THE NEW ANALYTICS DASHBOARD 👇
            <div className="w-full animate-in fade-in duration-300">
              {!analyticsData ? (
                <div className="text-center py-20 text-slate-400">
                  Loading Analytics...
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Active Roles
                      </p>
                      <p className="text-4xl font-extrabold text-blue-400">
                        {analyticsData.totalJobs}
                      </p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Total Candidates
                      </p>
                      <p className="text-4xl font-extrabold text-purple-400">
                        {analyticsData.totalApplications}
                      </p>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Avg. AI Match Score
                      </p>
                      <div className="flex items-end gap-2">
                        {analyticsData.averageAiScore > 0 ? (
                          <>
                            <p className="text-4xl font-extrabold text-emerald-400">
                              {analyticsData.averageAiScore}
                            </p>
                            <span className="text-xl font-bold text-emerald-500/50 mb-1">
                              %
                            </span>
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-slate-500 italic mt-2">
                            Pending AI...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recharts Pipeline Bar Chart */}
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl mt-4">
                    <h3 className="text-xl font-bold text-slate-100 mb-8 flex items-center gap-2">
                      <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                      Candidate Pipeline Distribution
                    </h3>

                    <div className="w-full h-[350px]">
                      <ResponsiveContainer width="99%" height="100%">
                        <BarChart
                          data={Object.entries(analyticsData.pipeline).map(
                            ([name, value]) => ({ name, value }),
                          )}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 20,
                          }}
                        >
                          <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            tick={{
                              fill: "#cbd5e1",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#334155", opacity: 0.4 }}
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              borderColor: "#334155",
                              color: "#f8fafc",
                              borderRadius: "8px",
                              fontWeight: "bold",
                            }}
                            itemStyle={{ color: "#818cf8" }}
                          />
                          <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            barSize={50}
                          >
                            {Object.entries(analyticsData.pipeline).map(
                              (entry, index) => {
                                const colors = {
                                  APPLIED: "#3b82f6",
                                  REVIEWING: "#eab308",
                                  INTERVIEWING: "#a855f7",
                                  OFFERED: "#10b981",
                                  REJECTED: "#ef4444",
                                };
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={colors[entry[0]] || "#64748b"}
                                  />
                                );
                              },
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
