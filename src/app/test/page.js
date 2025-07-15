"use client";

import { useState } from "react";
import { generatePlan } from "../action/ai-plan/route";
import { uploadDummyPhoto } from "../action/upload-photo/route";
import { askCoach } from "../action/ai-coach/route";

export default function TestPage() {
  // AI Plan state
  const [planInput, setPlanInput] = useState({
    beratAwal: "",
    beratTarget: "",
    durasiMinggu: "",
    goal: "cutting",
  });
  const [planResult, setPlanResult] = useState(null);
  const [planError, setPlanError] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Upload Photo state
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // AI Coach state
  const [coachMessage, setCoachMessage] = useState("");
  const [coachResult, setCoachResult] = useState(null);
  const [coachError, setCoachError] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // Handlers
  async function handlePlanSubmit(e) {
    e.preventDefault();
    setPlanLoading(true);
    setPlanError(null);
    setPlanResult(null);
    try {
      const formData = new FormData();
      formData.append("beratAwal", planInput.beratAwal);
      formData.append("beratTarget", planInput.beratTarget);
      formData.append("durasiMinggu", planInput.durasiMinggu);
      formData.append("goal", planInput.goal);
      const res = await generatePlan(formData);
      setPlanResult(res);
    } catch (err) {
      setPlanError(err.message || "Terjadi kesalahan");
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleUpload() {
    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const res = await uploadDummyPhoto();
      setUploadResult(res);
    } catch (err) {
      setUploadError(err.message || "Terjadi kesalahan");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleCoachSubmit(e) {
    e.preventDefault();
    setCoachLoading(true);
    setCoachError(null);
    setCoachResult(null);
    try {
      const formData = new FormData();
      formData.append("message", coachMessage);
      const res = await askCoach(formData);
      setCoachResult(res);
    } catch (err) {
      setCoachError(err.message || "Terjadi kesalahan");
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Testing Semua Fitur</h1>

      {/* AI Plan Form */}
      <section style={{ marginBottom: 40 }}>
        <h2>AI Plan Generator</h2>
        <form onSubmit={handlePlanSubmit}>
          <label>
            Berat Awal (kg):
            <input
              type="number"
              value={planInput.beratAwal}
              onChange={(e) =>
                setPlanInput({ ...planInput, beratAwal: e.target.value })
              }
              required
            />
          </label>
          <br />
          <label>
            Berat Target (kg):
            <input
              type="number"
              value={planInput.beratTarget}
              onChange={(e) =>
                setPlanInput({ ...planInput, beratTarget: e.target.value })
              }
              required
            />
          </label>
          <br />
          <label>
            Durasi Minggu:
            <input
              type="number"
              value={planInput.durasiMinggu}
              onChange={(e) =>
                setPlanInput({ ...planInput, durasiMinggu: e.target.value })
              }
              required
            />
          </label>
          <br />
          <label>
            Goal:
            <select
              value={planInput.goal}
              onChange={(e) =>
                setPlanInput({ ...planInput, goal: e.target.value })
              }
              required
            >
              <option value="cutting">Cutting</option>
              <option value="bulking">Bulking</option>
              <option value="maintain">Maintain</option>
            </select>
          </label>
          <br />
          <button type="submit" disabled={planLoading}>
            {planLoading ? "Loading..." : "Generate Plan"}
          </button>
        </form>
        {planError && <p style={{ color: "red" }}>Error: {planError}</p>}
        {planResult && (
          <div style={{ marginTop: 10 }}>
            <p>Daily Calories: {planResult.dailyCalories}</p>
            <p>Workout Style: {planResult.workoutStyle}</p>
            <p>Meal Type: {planResult.mealType}</p>
          </div>
        )}
      </section>

      {/* Upload Photo */}
      <section style={{ marginBottom: 40 }}>
        <h2>Upload Photo</h2>
        <button onClick={handleUpload} disabled={uploadLoading}>
          {uploadLoading ? "Loading..." : "Upload Dummy Photo"}
        </button>
        {uploadError && <p style={{ color: "red" }}>Error: {uploadError}</p>}
        {uploadResult && (
          <div style={{ marginTop: 10 }}>
            <p>URL: {uploadResult.url}</p>
            <img
              src={uploadResult.url}
              alt="Uploaded"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}
      </section>

      {/* AI Coach */}
      <section>
        <h2>AI Coach</h2>
        <form onSubmit={handleCoachSubmit}>
          <label>
            Message:
            <input
              type="text"
              value={coachMessage}
              onChange={(e) => setCoachMessage(e.target.value)}
              required
            />
          </label>
          <br />
          <button type="submit" disabled={coachLoading}>
            {coachLoading ? "Loading..." : "Ask Coach"}
          </button>
        </form>
        {coachError && <p style={{ color: "red" }}>Error: {coachError}</p>}
        {coachResult && (
          <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
            {coachResult}
          </div>
        )}
      </section>
    </div>
  );
}
