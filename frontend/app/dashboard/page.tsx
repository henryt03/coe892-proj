"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLoggedIn,
  logout,
  getProfile,
  getMyCheckouts,
  getMyReservations,
  returnBook,
  renewCheckout,
  cancelReservation,
  getBook,
  updatePreferences,
} from "@/lib/api";
import "./dashboard.css";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  preferred_genres?: string[];
};

type Checkout = {
  _id: string;
  user_id: string;
  book_id: string;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
  status: "active" | "returned";
  renewal_count: number;
  book?: {
    title: string;
    author: string;
    cover_image?: string;
  };
};

type Reservation = {
  _id: string;
  user_id: string;
  book_id: string;
  reservation_date: string;
  status: string;
  book?: {
    title: string;
    author: string;
    cover_image?: string;
  };
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [savedGenres, setSavedGenres] = useState<string[]>([]);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState("");

  const GENRES = [
    "Fiction",
    "Science Fiction",
    "Mystery",
    "Non-Fiction",
    "Technology",
    "Biography",
    "Fantasy",
  ];

  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      // Load user profile
      const profile = await getProfile();
      setUser(profile);
      setSelectedGenres(profile.preferred_genres || []);
      setSavedGenres(profile.preferred_genres || []);

      // Load checkouts and reservations in parallel
      const [checkoutsData, reservationsData] = await Promise.all([
        getMyCheckouts(),
        getMyReservations(),
      ]);

      // Enrich checkouts with book details
      const enrichedCheckouts = await Promise.all(
        checkoutsData.map(async (checkout: Checkout) => {
          try {
            const book = await getBook(checkout.book_id);
            return { ...checkout, book };
          } catch {
            return checkout;
          }
        }),
      );

      // Enrich reservations with book details
      const enrichedReservations = await Promise.all(
        reservationsData.map(async (reservation: Reservation) => {
          try {
            const book = await getBook(reservation.book_id);
            return { ...reservation, book };
          } catch {
            return reservation;
          }
        }),
      );

      setCheckouts(enrichedCheckouts);
      setReservations(enrichedReservations);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(checkoutId: string) {
    setActionLoading(checkoutId);
    try {
      await returnBook(checkoutId);
      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to return book");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRenew(checkoutId: string) {
    setActionLoading(checkoutId);
    try {
      await renewCheckout(checkoutId);
      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to renew checkout");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    setActionLoading(reservationId);
    try {
      await cancelReservation(reservationId);
      await loadDashboardData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to cancel reservation",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleGenreToggle(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
    setPrefMessage("");
  }

  async function handleSavePreferences() {
    setPrefSaving(true);
    setPrefMessage("");
    try {
      await updatePreferences(selectedGenres);
      setSavedGenres([...selectedGenres]);
      setPrefMessage("Preferences saved!");
    } catch (err) {
      setPrefMessage(
        err instanceof Error ? err.message : "Failed to save preferences",
      );
    } finally {
      setPrefSaving(false);
    }
  }

  const prefsChanged =
    JSON.stringify([...selectedGenres].sort()) !==
    JSON.stringify([...savedGenres].sort());

  function getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const activeCheckouts = checkouts.filter((c) => c.status === "active");
  const checkoutHistory = checkouts.filter((c) => c.status === "returned");
  const activeReservations = reservations.filter((r) => r.status === "active");

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-message">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={() => router.push("/home")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <h1 className="dashboard-title">My Dashboard</h1>
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => router.push("/home")}>
            Browse Catalog
          </button>
          {user && (user.role === "admin" || user.role === "librarian") && (
            <button
              className="nav-button admin"
              onClick={() => router.push("/admin")}
            >
              Admin Panel
            </button>
          )}
          <button className="nav-button logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="profile-card">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{activeCheckouts.length}</span>
              <span className="stat-label">Books Borrowed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{activeReservations.length}</span>
              <span className="stat-label">Reservations</span>
            </div>
            <div className="stat">
              <span className="stat-value">{checkoutHistory.length}</span>
              <span className="stat-label">Books Read</span>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      {user && (
        <section className="dashboard-section">
          <h2 className="section-title">My Preferences</h2>
          <div className="preferences-card">
            <p className="preferences-label">
              Select your preferred genres to get personalized recommendations:
            </p>
            <div className="genre-chips">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={`genre-chip ${selectedGenres.includes(genre) ? "selected" : ""}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="preferences-actions">
              {prefsChanged && (
                <button
                  className="action-btn save-prefs"
                  onClick={handleSavePreferences}
                  disabled={prefSaving}
                >
                  {prefSaving ? "Saving..." : "Save Preferences"}
                </button>
              )}
              {prefMessage && (
                <span
                  className={`pref-message ${prefMessage.includes("saved") ? "success" : "error"}`}
                >
                  {prefMessage}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Active Checkouts Section */}
      <section className="dashboard-section">
        <h2 className="section-title">
          Current Checkouts
          {activeCheckouts.length > 0 && (
            <span className="count-badge">{activeCheckouts.length}</span>
          )}
        </h2>

        {activeCheckouts.length === 0 ? (
          <div className="empty-state">
            <p>You don&apos;t have any books checked out.</p>
            <button
              className="browse-button"
              onClick={() => router.push("/home")}
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="checkout-list">
            {activeCheckouts.map((checkout) => {
              const daysUntilDue = getDaysUntilDue(checkout.due_date);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

              return (
                <div key={checkout._id} className="checkout-card">
                  <img
                    src={checkout.book?.cover_image || "/placeholder-book.png"}
                    alt={checkout.book?.title || "Book"}
                    className="checkout-cover"
                    onClick={() => router.push(`/book/${checkout.book_id}`)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/80x120?text=No+Cover";
                    }}
                  />
                  <div className="checkout-info">
                    <h3
                      className="checkout-title"
                      onClick={() => router.push(`/book/${checkout.book_id}`)}
                    >
                      {checkout.book?.title || "Unknown Book"}
                    </h3>
                    <p className="checkout-author">
                      {checkout.book?.author || "Unknown Author"}
                    </p>
                    <p className="checkout-date">
                      Borrowed: {formatDate(checkout.checkout_date)}
                    </p>
                    <div
                      className={`due-date ${isOverdue ? "overdue" : isDueSoon ? "due-soon" : ""}`}
                    >
                      {isOverdue ? (
                        <>
                          Due: {formatDate(checkout.due_date)} (Overdue by{" "}
                          {Math.abs(daysUntilDue)} days)
                        </>
                      ) : isDueSoon ? (
                        <>
                          Due: {formatDate(checkout.due_date)} ({daysUntilDue}{" "}
                          days left)
                        </>
                      ) : (
                        <>
                          Due: {formatDate(checkout.due_date)} ({daysUntilDue}{" "}
                          days left)
                        </>
                      )}
                    </div>
                    <p className="renewal-info">
                      Renewals used: {checkout.renewal_count}/2
                    </p>
                  </div>
                  <div className="checkout-actions">
                    <button
                      className="action-btn return"
                      onClick={() => handleReturn(checkout._id)}
                      disabled={actionLoading === checkout._id}
                    >
                      {actionLoading === checkout._id ? "..." : "Return"}
                    </button>
                    {checkout.renewal_count < 2 && (
                      <button
                        className="action-btn renew"
                        onClick={() => handleRenew(checkout._id)}
                        disabled={actionLoading === checkout._id}
                      >
                        {actionLoading === checkout._id ? "..." : "Renew"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reservations Section */}
      <section className="dashboard-section">
        <h2 className="section-title">
          My Reservations
          {activeReservations.length > 0 && (
            <span className="count-badge">{activeReservations.length}</span>
          )}
        </h2>

        {activeReservations.length === 0 ? (
          <div className="empty-state">
            <p>You don&apos;t have any active reservations.</p>
          </div>
        ) : (
          <div className="reservation-list">
            {activeReservations.map((reservation) => (
              <div key={reservation._id} className="reservation-card">
                <img
                  src={reservation.book?.cover_image || "/placeholder-book.png"}
                  alt={reservation.book?.title || "Book"}
                  className="reservation-cover"
                  onClick={() => router.push(`/book/${reservation.book_id}`)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/60x90?text=No+Cover";
                  }}
                />
                <div className="reservation-info">
                  <h3
                    className="reservation-title"
                    onClick={() => router.push(`/book/${reservation.book_id}`)}
                  >
                    {reservation.book?.title || "Unknown Book"}
                  </h3>
                  <p className="reservation-author">
                    {reservation.book?.author || "Unknown Author"}
                  </p>
                  <p className="reservation-date">
                    Reserved: {formatDate(reservation.reservation_date)}
                  </p>
                </div>
                <button
                  className="action-btn cancel"
                  onClick={() => handleCancelReservation(reservation._id)}
                  disabled={actionLoading === reservation._id}
                >
                  {actionLoading === reservation._id ? "..." : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Checkout History Section */}
      <section className="dashboard-section">
        <h2 className="section-title">
          Reading History
          {checkoutHistory.length > 0 && (
            <span className="count-badge secondary">
              {checkoutHistory.length}
            </span>
          )}
        </h2>

        {checkoutHistory.length === 0 ? (
          <div className="empty-state">
            <p>Your reading history will appear here.</p>
          </div>
        ) : (
          <div className="history-list">
            {checkoutHistory.map((checkout) => (
              <div key={checkout._id} className="history-card">
                <img
                  src={checkout.book?.cover_image || "/placeholder-book.png"}
                  alt={checkout.book?.title || "Book"}
                  className="history-cover"
                  onClick={() => router.push(`/book/${checkout.book_id}`)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/50x75?text=No+Cover";
                  }}
                />
                <div className="history-info">
                  <h4
                    className="history-title"
                    onClick={() => router.push(`/book/${checkout.book_id}`)}
                  >
                    {checkout.book?.title || "Unknown Book"}
                  </h4>
                  <p className="history-author">
                    {checkout.book?.author || "Unknown Author"}
                  </p>
                  <p className="history-dates">
                    {formatDate(checkout.checkout_date)} -{" "}
                    {checkout.return_date
                      ? formatDate(checkout.return_date)
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
