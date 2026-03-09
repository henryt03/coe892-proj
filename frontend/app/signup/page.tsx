"use client";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import "./signup.css";

export default function Signup() {
  const [currForm, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "member",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const name = e.target.name;
    const value = e.target.value;

    setForm({
      ...currForm,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(currForm);
      router.push("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="signup-card">
            <h3 className="signup-title">Sign Up</h3>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  className="form-control signup-input"
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  className="form-control signup-input"
                  name="email"
                  type="email"
                  placeholder="Email"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  className="form-control signup-input"
                  name="password"
                  type="password"
                  placeholder="Password"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  className="form-control signup-input"
                  name="phone"
                  placeholder="Phone"
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <input
                  className="form-control signup-input"
                  name="address"
                  placeholder="Address"
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <select
                  className="form-control signup-select"
                  name="role"
                  onChange={handleChange}
                >
                  <option value="member">Member</option>
                  <option value="librarian">Librarian</option>
                </select>
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="signup-footer">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="signup-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
