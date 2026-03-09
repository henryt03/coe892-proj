"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLoggedIn,
  logout,
  getProfile,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getLibraryStats,
} from "@/lib/api";
import "./admin.css";

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
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type Stats = {
  total_books: number;
  total_users: number;
  active_checkouts: number;
  overdue_checkouts: number;
};

type BookForm = {
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  publisher: string;
  published_year: string;
  total_copies: string;
  available_copies: string;
  cover_image: string;
};

const CATEGORIES = [
  "Fiction",
  "Science Fiction",
  "Mystery",
  "Non-Fiction",
  "Technology",
  "Biography",
  "Fantasy",
];

const emptyBookForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  category: "Fiction",
  description: "",
  publisher: "",
  published_year: "",
  total_copies: "1",
  available_copies: "1",
  cover_image: "",
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState<BookForm>(emptyBookForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    try {
      const profile = await getProfile();
      if (profile.role !== "admin" && profile.role !== "librarian") {
        router.push("/home");
        return;
      }
      setUser(profile);
      await Promise.all([fetchBooks(), fetchStats()]);
    } catch {
      logout();
      router.push("/login");
    }
  }

  async function fetchBooks() {
    setLoading(true);
    try {
      const data = await getBooks({ limit: 100 });
      setBooks(data);
    } catch (err) {
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await getLibraryStats();
      setStats(data);
    } catch {
      // Stats might fail if not admin, ignore
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function openCreateModal() {
    setEditingBook(null);
    setBookForm(emptyBookForm);
    setShowModal(true);
  }

  function openEditModal(book: Book) {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      description: book.description || "",
      publisher: book.publisher || "",
      published_year: book.published_year?.toString() || "",
      total_copies: book.total_copies.toString(),
      available_copies: book.available_copies.toString(),
      cover_image: book.cover_image || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBook(null);
    setBookForm(emptyBookForm);
    setError("");
  }

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setBookForm({
      ...bookForm,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const bookData = {
      title: bookForm.title,
      author: bookForm.author,
      isbn: bookForm.isbn,
      category: bookForm.category,
      description: bookForm.description || undefined,
      publisher: bookForm.publisher || undefined,
      published_year: bookForm.published_year
        ? parseInt(bookForm.published_year)
        : undefined,
      total_copies: parseInt(bookForm.total_copies),
      available_copies: parseInt(bookForm.available_copies),
      cover_image: bookForm.cover_image || undefined,
    };

    try {
      if (editingBook) {
        await updateBook(editingBook._id, bookData);
      } else {
        await createBook(bookData as Parameters<typeof createBook>[0]);
      }
      closeModal();
      await fetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bookId: string) {
    try {
      await deleteBook(bookId);
      setDeleteConfirm(null);
      await fetchBooks();
      await fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete book");
    }
  }

  if (!user) {
    return <div className="admin-loading">Checking access...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <h1 className="admin-title">Admin Dashboard</h1>
          <span className="role-badge">{user.role}</span>
        </div>
        <div className="header-right">
          <span className="user-name">{user.name}</span>
          <button className="nav-button" onClick={() => router.push("/home")}>
            View Catalog
          </button>
          <button className="nav-button logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Stats Section */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total_books}</div>
            <div className="stat-label">Total Books</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.active_checkouts}</div>
            <div className="stat-label">Active Checkouts</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{stats.overdue_checkouts}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      )}

      {/* Books Management Section */}
      <div className="books-section">
        <div className="section-header">
          <h2>Manage Books</h2>
          <button className="add-button" onClick={openCreateModal}>
            + Add New Book
          </button>
        </div>

        {loading ? (
          <div className="loading-message">Loading books...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Copies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id}>
                  <td className="title-cell">{book.title}</td>
                  <td>{book.author}</td>
                  <td className="isbn-cell">{book.isbn}</td>
                  <td>
                    <span className="category-badge">{book.category}</span>
                  </td>
                  <td>
                    <span
                      className={
                        book.available_copies > 0 ? "available" : "unavailable"
                      }
                    >
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit"
                      onClick={() => openEditModal(book)}
                    >
                      Edit
                    </button>
                    {user.role === "admin" && (
                      <>
                        {deleteConfirm === book._id ? (
                          <div className="delete-confirm">
                            <button
                              className="action-btn confirm-yes"
                              onClick={() => handleDelete(book._id)}
                            >
                              Yes
                            </button>
                            <button
                              className="action-btn confirm-no"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(book._id)}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Create/Edit Book */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingBook ? "Edit Book" : "Add New Book"}
            </h2>

            {error && <div className="modal-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={bookForm.title}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    name="author"
                    value={bookForm.author}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ISBN *</label>
                  <input
                    type="text"
                    name="isbn"
                    value={bookForm.isbn}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={bookForm.category}
                    onChange={handleFormChange}
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={bookForm.publisher}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Published Year</label>
                  <input
                    type="number"
                    name="published_year"
                    value={bookForm.published_year}
                    onChange={handleFormChange}
                    min="1000"
                    max="2100"
                  />
                </div>

                <div className="form-group">
                  <label>Total Copies *</label>
                  <input
                    type="number"
                    name="total_copies"
                    value={bookForm.total_copies}
                    onChange={handleFormChange}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Available Copies *</label>
                  <input
                    type="number"
                    name="available_copies"
                    value={bookForm.available_copies}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Cover Image URL</label>
                  <input
                    type="url"
                    name="cover_image"
                    value={bookForm.cover_image}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={bookForm.description}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingBook
                      ? "Update Book"
                      : "Create Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
