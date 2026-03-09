"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  isLoggedIn,
  logout,
  getProfile,
  getBook,
  checkoutBook,
  reserveBook,
  getBookAverageRating,
  getBookRatings,
  getMyRatingForBook,
  createOrUpdateRating,
} from "@/lib/api";
import "./book-details.css";

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
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type Rating = {
  _id: string;
  user_id: string;
  book_id: string;
  rating: number;
  review?: string;
  user_name?: string;
  created_at: string;
};

type AverageRating = {
  average_rating: number;
  total_ratings: number;
};

export default function BookDetailsPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Rating state
  const [averageRating, setAverageRating] = useState<AverageRating>({
    average_rating: 0,
    total_ratings: 0,
  });
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [myRating, setMyRating] = useState<Rating | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

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

    // Fetch book details and ratings
    fetchBook();
    fetchRatings();
  }, [bookId]);

  useEffect(() => {
    // Fetch user's rating when user is loaded
    if (user && bookId) {
      fetchMyRating();
    }
  }, [user, bookId]);

  async function fetchBook() {
    setLoading(true);
    setError("");
    try {
      const data = await getBook(bookId);
      setBook(data);
    } catch (err) {
      setError("Failed to load book details. The book may not exist.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRatings() {
    try {
      const [avgRating, ratings] = await Promise.all([
        getBookAverageRating(bookId),
        getBookRatings(bookId),
      ]);
      setAverageRating(avgRating);
      setAllRatings(ratings);
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  }

  async function fetchMyRating() {
    try {
      const rating = await getMyRatingForBook(bookId);
      if (rating) {
        setMyRating(rating);
        setSelectedRating(rating.rating);
        setReviewText(rating.review || "");
      }
    } catch (err) {
      console.error("Failed to load my rating:", err);
    }
  }

  async function handleSubmitRating() {
    if (!loggedIn || !user) {
      router.push("/login");
      return;
    }

    if (selectedRating === 0) {
      alert("Please select a rating");
      return;
    }

    setRatingLoading(true);
    try {
      await createOrUpdateRating(bookId, selectedRating, reviewText || undefined);
      await fetchRatings();
      await fetchMyRating();
      alert(myRating ? "Rating updated!" : "Thank you for your rating!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setRatingLoading(false);
    }
  }

  async function handleBorrow() {
    if (!loggedIn || !user) {
      router.push("/login");
      return;
    }

    if (!book) return;

    setActionLoading(true);
    try {
      await checkoutBook(book._id, user._id);
      await fetchBook();
      alert(`Successfully borrowed "${book.title}"!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to borrow book");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReserve() {
    if (!loggedIn || !user) {
      router.push("/login");
      return;
    }

    if (!book) return;

    setActionLoading(true);
    try {
      await reserveBook(book._id, user._id);
      alert(
        `Successfully reserved "${book.title}"! You'll be notified when it's available.`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reserve book");
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setUser(null);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderStars(rating: number, interactive: boolean = false) {
    return (
      <div className={`star-rating ${interactive ? "interactive" : ""}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${
              star <= (interactive ? hoverRating || selectedRating : rating)
                ? "filled"
                : ""
            }`}
            onClick={
              interactive
                ? () => setSelectedRating(star)
                : undefined
            }
            onMouseEnter={
              interactive
                ? () => setHoverRating(star)
                : undefined
            }
            onMouseLeave={
              interactive
                ? () => setHoverRating(0)
                : undefined
            }
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="book-details-container">
        <div className="loading-message">Loading book details...</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-details-container">
        <div className="error-message">{error || "Book not found"}</div>
        <button className="back-button" onClick={() => router.push("/home")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? allRatings : allRatings.slice(0, 3);

  return (
    <div className="book-details-container">
      <div className="top-bar">
        <button className="back-button" onClick={() => router.push("/home")}>
          &larr; Back to Catalog
        </button>

        {loggedIn && user ? (
          <div className="auth-buttons">
            <span className="user-greeting">Hello, {user.name}</span>
            <button
              className="account-button"
              onClick={() => router.push("/dashboard")}
            >
              My Dashboard
            </button>
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

      <div className="book-details-card">
        <div className="book-cover-section">
          <img
            src={book.cover_image || "/placeholder-book.png"}
            className="book-cover-large"
            alt={book.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/300x450?text=No+Cover";
            }}
          />

          <div className="availability-section">
            <div
              className={`availability-badge ${
                book.available_copies > 0 ? "available" : "unavailable"
              }`}
            >
              {book.available_copies > 0 ? "Available" : "Not Available"}
            </div>
            <p className="copies-info">
              {book.available_copies} of {book.total_copies} copies available
            </p>

            {book.available_copies > 0 ? (
              <button
                className="action-button borrow"
                onClick={handleBorrow}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Borrow This Book"}
              </button>
            ) : (
              <button
                className="action-button reserve"
                onClick={handleReserve}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Reserve This Book"}
              </button>
            )}
          </div>
        </div>

        <div className="book-info-section">
          <span className="category-badge">{book.category}</span>
          <h1 className="book-title">{book.title}</h1>
          <p className="book-author">by {book.author}</p>

          {/* Average Rating Display */}
          <div className="average-rating-display">
            {renderStars(Math.round(averageRating.average_rating))}
            <span className="rating-text">
              {averageRating.average_rating > 0
                ? `${averageRating.average_rating} out of 5`
                : "No ratings yet"}
              {averageRating.total_ratings > 0 && (
                <span className="rating-count">
                  ({averageRating.total_ratings} review
                  {averageRating.total_ratings !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          </div>

          {book.description && (
            <div className="book-description-section">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}

          <div className="book-metadata">
            <h3>Book Details</h3>
            <table className="metadata-table">
              <tbody>
                <tr>
                  <td className="label">ISBN</td>
                  <td>{book.isbn}</td>
                </tr>
                {book.publisher && (
                  <tr>
                    <td className="label">Publisher</td>
                    <td>{book.publisher}</td>
                  </tr>
                )}
                {book.published_year && (
                  <tr>
                    <td className="label">Published</td>
                    <td>{book.published_year}</td>
                  </tr>
                )}
                <tr>
                  <td className="label">Category</td>
                  <td>{book.category}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="ratings-section">
        {/* Submit Rating */}
        <div className="submit-rating-card">
          <h3>{myRating ? "Update Your Rating" : "Rate This Book"}</h3>
          {loggedIn ? (
            <>
              <div className="rating-input">
                <p>Your rating:</p>
                {renderStars(selectedRating, true)}
              </div>
              <div className="review-input">
                <label htmlFor="review">Your review (optional):</label>
                <textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  rows={3}
                />
              </div>
              <button
                className="submit-rating-btn"
                onClick={handleSubmitRating}
                disabled={ratingLoading || selectedRating === 0}
              >
                {ratingLoading
                  ? "Submitting..."
                  : myRating
                    ? "Update Rating"
                    : "Submit Rating"}
              </button>
            </>
          ) : (
            <p className="login-prompt">
              <button onClick={() => router.push("/login")}>Log in</button> to
              rate this book
            </p>
          )}
        </div>

        {/* Reviews List */}
        <div className="reviews-list-card">
          <h3>
            Reviews
            {allRatings.length > 0 && (
              <span className="review-count">({allRatings.length})</span>
            )}
          </h3>
          {allRatings.length === 0 ? (
            <p className="no-reviews">
              No reviews yet. Be the first to review this book!
            </p>
          ) : (
            <>
              <div className="reviews-list">
                {displayedReviews.map((rating) => (
                  <div key={rating._id} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">
                        {rating.user_name || "Anonymous"}
                      </span>
                      <div className="review-rating">
                        {renderStars(rating.rating)}
                      </div>
                      <span className="review-date">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                    {rating.review && (
                      <p className="review-text">{rating.review}</p>
                    )}
                  </div>
                ))}
              </div>
              {allRatings.length > 3 && (
                <button
                  className="show-more-btn"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews
                    ? "Show Less"
                    : `Show All ${allRatings.length} Reviews`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
