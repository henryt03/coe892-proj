"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLoggedIn,
  logout,
  getProfile,
  getBooks,
  checkoutBook,
  reserveBook,
  getPreferenceRecommendations,
} from "@/lib/api";
import "./home.css";

// Book type matching your MongoDB schema
type Book = {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description?: string;
  publisher?: string;
  published_year?: number;
  total_copies: number;
  available_copies: number;
  cover_image?: string;
  created_at: string;
  recommendation_reason?: string;
  avg_rating?: number;
  num_ratings?: number;
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  preferred_genres?: string[];
};

// Available categories from your seeded data
const CATEGORIES = [
  "All Categories",
  "Fiction",
  "Science Fiction",
  "Mystery",
  "Non-Fiction",
  "Technology",
  "Biography",
  "Fantasy",
];

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortField, setSortField] = useState<keyof Book>("title");
  const [ascending, setAscending] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const router = useRouter();

  // Fetch books from real API
  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      if (showRecommendations && user) {
        const data = await getPreferenceRecommendations(user._id);
        setBooks(data);
      } else {
        const data = await getBooks({
          search: search || undefined,
          category: category || undefined,
        });
        setBooks(data);
      }
    } catch (err) {
      setError("Failed to load books. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    if (isLoggedIn()) {
      setLoggedIn(true);
      getProfile()
        .then((profile) => setUser(profile))
        .catch(() => {
          logout();
          setLoggedIn(false);
        });
    }

    // Initial fetch
    fetchBooks();
  }, []);

  // Refetch when category changes
  useEffect(() => {
    if (!showRecommendations) {
      fetchBooks();
    }
  }, [category]);

  // Refetch when recommendations toggle changes
  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [showRecommendations]);

  // Handle search with debounce
  useEffect(() => {
    if (!showRecommendations) {
      const timer = setTimeout(() => {
        fetchBooks();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  // Client-side sorting
  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    sorted.sort((a, b) => {
      const valA = String(a[sortField] ?? "");
      const valB = String(b[sortField] ?? "");

      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [books, sortField, ascending]);

  function handleSort(field: keyof Book) {
    if (field === sortField) {
      setAscending(!ascending);
    } else {
      setSortField(field);
      setAscending(true);
    }
  }

  async function handleBorrow(book: Book) {
    if (!loggedIn || !user) {
      router.push("/login");
      return;
    }

    setBorrowingId(book._id);
    try {
      await checkoutBook(book._id, user._id);
      // Refresh books to show updated availability
      await fetchBooks();
      alert(`Successfully borrowed "${book.title}"!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to borrow book");
    } finally {
      setBorrowingId(null);
    }
  }

  async function handleReserve(book: Book) {
    if (!loggedIn || !user) {
      router.push("/login");
      return;
    }

    setReservingId(book._id);
    try {
      await reserveBook(book._id, user._id);
      alert(
        `Successfully reserved "${book.title}"! You'll be notified when it's available.`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reserve book");
    } finally {
      setReservingId(null);
    }
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setUser(null);
  }

  return (
    <div className="library-container">
      <h1 className="library-title">
        {showRecommendations ? "Recommended For You" : "Library Catalog"}
      </h1>

      <div className="top-bar">
        <div className="search-filters">
          <input
            className="search-bar"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={showRecommendations}
          />
          <select
            className="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={showRecommendations}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat === "All Categories" ? "" : cat}>
                {cat}
              </option>
            ))}
          </select>
          {loggedIn && user && (
            <button
              className={`recommendations-toggle ${showRecommendations ? "active" : ""}`}
              onClick={() => setShowRecommendations(!showRecommendations)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: showRecommendations ? "2px solid #7c3aed" : "1px solid #ccc",
                background: showRecommendations ? "#7c3aed" : "white",
                color: showRecommendations ? "white" : "#333",
                cursor: "pointer",
                fontWeight: 500,
                marginLeft: "10px",
              }}
            >
              {showRecommendations ? "Show All Books" : "For You"}
            </button>
          )}
        </div>

        {loggedIn && user ? (
          <div className="auth-buttons">
            <span className="user-greeting">Hello, {user.name}</span>
            <button
              className="account-button"
              onClick={() => router.push("/dashboard")}
            >
              My Dashboard
            </button>
            {(user.role === "admin" || user.role === "librarian") && (
              <button
                className="account-button admin-link"
                onClick={() => router.push("/admin")}
              >
                Admin
              </button>
            )}
            <button className="account-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button
              className="account-button"
              onClick={() => router.push("/login")}
            >
              Login
            </button>
            <button
              className="account-button"
              onClick={() => router.push("/signup")}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading books...</div>
      ) : sortedBooks.length === 0 ? (
        <div className="empty-message">
          {showRecommendations
            ? user?.preferred_genres?.length
              ? "No recommendations found. Try browsing our full catalog!"
              : "Set your preferred genres in your profile to get personalized recommendations."
            : "No books found matching your search."}
        </div>
      ) : (
        <table className="book-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th onClick={() => handleSort("title")} className="sortable">
                Title {sortField === "title" && (ascending ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("author")} className="sortable">
                Author {sortField === "author" && (ascending ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("category")} className="sortable">
                Category {sortField === "category" && (ascending ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("published_year")}
                className="sortable"
              >
                Year {sortField === "published_year" && (ascending ? "↑" : "↓")}
              </th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedBooks.map((book) => (
              <tr key={book._id}>
                <td>
                  <img
                    src={book.cover_image || "/placeholder-book.png"}
                    className="book-cover clickable"
                    alt={book.title}
                    onClick={() => router.push(`/book/${book._id}`)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/150x240?text=No+Cover";
                    }}
                  />
                </td>
                <td className="book-title-cell">
                  <strong
                    className="book-title-link"
                    onClick={() => router.push(`/book/${book._id}`)}
                  >
                    {book.title}
                  </strong>
                  {book.recommendation_reason && (
                    <p
                      className="recommendation-reason"
                      style={{
                        fontSize: "0.8rem",
                        color: "#7c3aed",
                        margin: "4px 0",
                        fontStyle: "italic",
                      }}
                    >
                      {book.recommendation_reason}
                      {book.avg_rating !== undefined && book.avg_rating > 0 && (
                        <span style={{ marginLeft: "8px" }}>
                          ({book.avg_rating}/5 from {book.num_ratings} ratings)
                        </span>
                      )}
                    </p>
                  )}
                  {book.description && (
                    <p className="book-description">{book.description}</p>
                  )}
                </td>
                <td>{book.author}</td>
                <td>
                  <span className="category-badge">{book.category}</span>
                </td>
                <td>{book.published_year || "N/A"}</td>
                <td>
                  <span
                    className={
                      book.available_copies > 0 ? "available" : "unavailable"
                    }
                  >
                    {book.available_copies} / {book.total_copies}
                  </span>
                </td>
                <td>
                  {book.available_copies > 0 ? (
                    <button
                      className="borrow-button"
                      onClick={() => handleBorrow(book)}
                      disabled={borrowingId === book._id}
                    >
                      {borrowingId === book._id ? "..." : "Borrow"}
                    </button>
                  ) : (
                    <button
                      className="reserve-button"
                      onClick={() => handleReserve(book)}
                      disabled={reservingId === book._id}
                    >
                      {reservingId === book._id ? "..." : "Reserve"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="book-count">
        {showRecommendations
          ? `${sortedBooks.length} recommendation${sortedBooks.length !== 1 ? "s" : ""} based on your preferences`
          : `Showing ${sortedBooks.length} book${sortedBooks.length !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
