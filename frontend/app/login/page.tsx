"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="login-card">
            <h3 className="login-title">Welcome Back</h3>
            <p className="login-subtitle">Sign in to your library account</p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label login-label">
                  Email
                </label>
                <input
                  id="email"
                  className="form-control login-input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label login-label">
                  Password
                </label>
                <input
                  id="password"
                  className="form-control login-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="login-link">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
