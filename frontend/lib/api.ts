// API client for communicating with the backend
const API_BASE_URL = 'http://localhost:8000/api';

// Helper to get stored token
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Helper to make authenticated requests
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  // Handle 204 No Content (like delete responses)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ============ AUTH ENDPOINTS ============

export async function register(userData: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  address?: string;
}) {
  return fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(email: string, password: string) {
  const data = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store the token
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }

  return data;
}

export async function getProfile() {
  return fetchWithAuth('/auth/profile');
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ============ BOOKS ENDPOINTS ============

export async function getBooks(params?: {
  search?: string;
  category?: string;
  available?: boolean;
  skip?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.available) searchParams.set('available', 'true');
  if (params?.skip) searchParams.set('skip', params.skip.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  return fetchWithAuth(`/books${query ? `?${query}` : ''}`);
}

export async function getBook(bookId: string) {
  return fetchWithAuth(`/books/${bookId}`);
}

export async function createBook(bookData: {
  title: string;
  author: string;
  isbn: string;
  category: string;
  description?: string;
  publisher?: string;
  published_year?: number;
  total_copies?: number;
  available_copies?: number;
  cover_image?: string;
}) {
  return fetchWithAuth('/books', {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function updateBook(bookId: string, bookData: Partial<{
  title: string;
  author: string;
  category: string;
  description: string;
  publisher: string;
  published_year: number;
  total_copies: number;
  available_copies: number;
  cover_image: string;
}>) {
  return fetchWithAuth(`/books/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(bookData),
  });
}

export async function deleteBook(bookId: string) {
  return fetchWithAuth(`/books/${bookId}`, {
    method: 'DELETE',
  });
}

// ============ CHECKOUTS ENDPOINTS ============

export async function checkoutBook(bookId: string, userId: string) {
  return fetchWithAuth('/checkouts', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, user_id: userId }),
  });
}

export async function getMyCheckouts() {
  return fetchWithAuth('/checkouts/my');
}

export async function returnBook(checkoutId: string) {
  return fetchWithAuth(`/checkouts/${checkoutId}/return`, {
    method: 'PUT',
  });
}

export async function renewCheckout(checkoutId: string) {
  return fetchWithAuth(`/checkouts/${checkoutId}/renew`, {
    method: 'POST',
  });
}

// ============ RESERVATIONS ENDPOINTS ============

export async function reserveBook(bookId: string, userId: string) {
  return fetchWithAuth('/reservations', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, user_id: userId }),
  });
}

export async function getMyReservations() {
  return fetchWithAuth('/reservations/my');
}

export async function cancelReservation(reservationId: string) {
  return fetchWithAuth(`/reservations/${reservationId}`, {
    method: 'DELETE',
  });
}

// ============ ADMIN ENDPOINTS ============

export async function getLibraryStats() {
  return fetchWithAuth('/admin/stats');
}

export async function getOverdueCheckouts() {
  return fetchWithAuth('/admin/overdue');
}

// ============ RECOMMENDATIONS ENDPOINTS ============

export async function getRecommendations(userId: string) {
  return fetchWithAuth(`/recommendations/${userId}`);
}

// ============ RATINGS ENDPOINTS ============

export async function createOrUpdateRating(bookId: string, rating: number, review?: string) {
  return fetchWithAuth('/ratings', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, rating, review }),
  });
}

export async function getBookRatings(bookId: string) {
  return fetchWithAuth(`/ratings/book/${bookId}`);
}

export async function getBookAverageRating(bookId: string) {
  return fetchWithAuth(`/ratings/book/${bookId}/average`);
}

export async function getMyRatings() {
  return fetchWithAuth('/ratings/my');
}

export async function getMyRatingForBook(bookId: string) {
  return fetchWithAuth(`/ratings/my/${bookId}`);
}

export async function deleteRating(ratingId: string) {
  return fetchWithAuth(`/ratings/${ratingId}`, {
    method: 'DELETE',
  });
}
