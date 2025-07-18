"use client";
import { useState } from "react";
import { generatePlan, askCoach } from "../action";

export default function TestPage() {
  const [planResult, setPlanResult] = useState("");
  const [coachResult, setCoachResult] = useState("");
  const [form, setForm] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
    durasi: "",
    question: "",
    mealName: "",
    mealCalories: "",
    workoutName: "",
    workoutDuration: "",
    updatedWeight: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeneratePlan = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const output = await generatePlan(formData);
    setPlanResult(output);
  };

  const handleAskCoach = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const output = await askCoach(formData);
    setCoachResult(output);
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#222",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "32px", fontWeight: "bold" }}>
        🧪 AI Plan & Coach Tester
      </h1>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Gender <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Age <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
            required
            min="1"
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Height (cm) <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="height"
            type="number"
            value={form.height}
            onChange={handleChange}
            required
            min="1"
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter your height in cm"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Current Weight (kg) <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="weight"
            type="number"
            value={form.weight}
            onChange={handleChange}
            required
            min="1"
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter your current weight in kg"
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Activity Level <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          >
            <option value="">Select activity level</option>
            <option value="Sedentary">Sedentary</option>
            <option value="Lightly active">Lightly active</option>
            <option value="Moderately active">Moderately active</option>
            <option value="Very active">Very active</option>
            <option value="Extra active">Extra active</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Duration (weeks) <span style={{ color: "red" }}>*</span>
          </label>
          <input
            name="durasi"
            type="number"
            value={form.durasi}
            onChange={handleChange}
            min="1"
            placeholder="Enter duration in weeks"
            required
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Goal Prompt <span style={{ color: "red" }}>*</span>
          </label>
          <textarea
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder="Contoh: Saya ingin turun ke 60kg dalam 2 bulan."
            rows={3}
            required
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Question for AI Coach
          </label>
          <textarea
            name="question"
            value={form.question}
            onChange={handleChange}
            placeholder="Contoh: Apakah saya harus kardio tiap hari?"
            rows={3}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          />
        </div>

        <div>
          <label>Meal Name</label>
          <input
            name="mealName"
            value={form.mealName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Calories</label>
          <input
            name="mealCalories"
            type="number"
            value={form.mealCalories}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Workout Name</label>
          <input
            name="workoutName"
            value={form.workoutName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Workout Duration (minutes)</label>
          <input
            name="workoutDuration"
            type="number"
            value={form.workoutDuration}
            onChange={handleChange}
          />
        </div>

        <div style={{ gridColumn: "span 2" }}>
          <label>Progress: Updated Weight</label>
          <input
            name="updatedWeight"
            type="number"
            value={form.updatedWeight}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "16px" }}>
        <button onClick={handleGeneratePlan} style={buttonStyle}>
          Generate Plan
        </button>
        <button onClick={handleAskCoach} style={buttonStyle}>
          Ask Coach
        </button>
      </div>

      <div style={{ marginTop: "32px", display: "flex", gap: "40px" }}>
        <div style={{ flex: 1 }}>
          <h3>Generated Plan Result:</h3>
          <div style={resultBoxStyle}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{planResult}</pre>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3>AI Coach Answer:</h3>
          <div style={resultBoxStyle}>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{coachResult}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "12px 24px",
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "16px",
};

const resultBoxStyle = {
  background: "#f1f1f1",
  border: "1px solid #ccc",
  padding: "16px",
  maxHeight: "400px",
  overflowY: "auto",
  borderRadius: "6px",
};
