import React, { useState, useEffect, use } from "react";
import axios from "axios";

const RecruiterDashboard = ({ token }) => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchApplications();
    }
  }, [token]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const sortedApps = response.data.sort(
        (a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0),
      );

      setApplications(sortedApps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (!score) return "#6b7280"; // Gray for no score
    if (score >= 70) return "#22c55e"; // Green for strong match
    if (score >= 40) return "#eab308"; // Yellow for moderate match
    return "#ef4444"; // Red for weak match
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "50px auto",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Recruiter Dashboard: Applicant Rankings</h2>
        <button
          onClick={fetchApplications}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#374151",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {isLoading ? (
        <p>Loading intelligence data...</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            backgroundColor: "#1f2937",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "white",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                <th style={{ padding: "12px" }}>App ID</th>
                <th style={{ padding: "12px" }}>Candidate Name</th>
                <th style={{ padding: "12px" }}>Email</th>
                <th style={{ padding: "12px" }}>Job ID</th>
                <th style={{ padding: "12px" }}>AI Match Score</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ padding: "20px", textAlign: "center" }}
                  >
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: "1px solid #374151" }}
                  >
                    <td style={{ padding: "12px" }}>#{app.id}</td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>
                      {app.candidate?.name || app.name || "Unknown"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {app.candidate?.email || app.email || "N/A"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      Job #{app.job?.id || app.jobId || "?"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor: getScoreColor(app.aiMatchScore),
                          padding: "4px 10px",
                          borderRadius: "12px",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      >
                        {app.aiMatchScore
                          ? `${app.aiMatchScore}%`
                          : "Processing..."}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
