import React, { useState } from "react";
import axios from "axios";

const CandidatePortal = () => {
  const [formData, setFormData] = useState({
    jobId: "",
    name: "",
    email: "",
    resume: null,
  });

  const [statusMessage, setStatusMessage] = useState("");
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
      setStatusMessage("⚠️ Please attach a resume PDF.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Uploading and analyzing...");

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

      setStatusMessage(
        `✅ Success! Application ID: ${response.data.id || "Submitted"}`,
      );
      setFormData({ jobId: "", name: "", email: "", resume: null });
    } catch (error) {
      console.error("Upload failed:", error);
      setStatusMessage("❌ Failed to submit application. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "20px",
        fontFamily: "sans-serif",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Candidate Application Portal</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label>Job ID:</label>
          <br />
          <input
            type="number"
            name="jobId"
            value={formData.jobId}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Full Name:</label>
          <br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Email:</label>
          <br />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Resume (PDF only):</label>
          <br />
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Submitting..." : "Submit Application"}
        </button>
      </form>

      {statusMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#f4f4f4",
            borderRadius: "4px",
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default CandidatePortal;
