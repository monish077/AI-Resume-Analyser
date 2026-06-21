import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter email and password");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$|^$/g, '');
      const isLocalhost = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
      const url = (API_BASE && (!isLocalhost || import.meta.env.DEV)) ? `${API_BASE}/api/auth/register` : '/api/auth/register';

      const response = await axios.post(
        url,
        {
          email: cleanEmail,
          password,
        }
      );

      console.log("Register Response:", response.data);

      if (response.data?.access_token) {
        localStorage.setItem(
          "access_token",
          response.data.access_token
        );

        setSuccess(
          "Registration successful! Redirecting..."
        );

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);

        return;
      }

      setSuccess(
        "Registration successful! Please login."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(
        "Registration Error:",
        err?.response?.data || err
      );

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "Registration failed";

      setError(message);
    }
  };

  return (
    <div className="login-card">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <p className="error">{error}</p>
        )}

        {success && (
          <p className="success">{success}</p>
        )}

        <button type="submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;