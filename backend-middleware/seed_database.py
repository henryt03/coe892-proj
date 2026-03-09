"""
Database Seed Script
Run this to populate your MongoDB with sample data for testing.

Usage: python seed_database.py
"""

from config.database import connect_db, get_db
from middleware.auth import hash_password
from datetime import datetime, timedelta
from bson import ObjectId

def seed_users(db):
    """Create test users with different roles."""

    users = [
        {
            "email": "admin@library.com",
            "name": "Admin User",
            "password": hash_password("admin123"),
            "role": "admin",
            "phone": "555-0100",
            "address": "123 Admin St",
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "librarian@library.com",
            "name": "Lisa Librarian",
            "password": hash_password("librarian123"),
            "role": "librarian",
            "phone": "555-0101",
            "address": "456 Library Ave",
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "member@library.com",
            "name": "Mike Member",
            "password": hash_password("member123"),
            "role": "member",
            "phone": "555-0102",
            "address": "789 Reader Rd",
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "jane@example.com",
            "name": "Jane Doe",
            "password": hash_password("jane123"),
            "role": "member",
            "phone": "555-0103",
            "address": "321 Book Lane",
            "active": True,
            "created_at": datetime.utcnow()
        },
        {
            "email": "john@example.com",
            "name": "John Smith",
            "password": hash_password("john123"),
            "role": "member",
            "phone": "555-0104",
            "address": "654 Novel St",
            "active": True,
            "created_at": datetime.utcnow()
        }
    ]

    # Clear existing users
    db.users.delete_many({})

    # Insert users
    result = db.users.insert_many(users)
    print(f"Created {len(result.inserted_ids)} users")

    return result.inserted_ids

def seed_books(db):
    """Create sample books across different categories."""

    books = [
        # Fiction
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "978-0743273565",
            "category": "Fiction",
            "description": "A story of decadence and excess, Gatsby explores the American Dream in the Jazz Age.",
            "publisher": "Scribner",
            "published_year": 1925,
            "total_copies": 5,
            "available_copies": 5,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "isbn": "978-0061120084",
            "category": "Fiction",
            "description": "A gripping tale of racial injustice and childhood innocence in the American South.",
            "publisher": "Harper Perennial",
            "published_year": 1960,
            "total_copies": 4,
            "available_copies": 4,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "978-0451524935",
            "category": "Fiction",
            "description": "A dystopian social science fiction novel about totalitarianism.",
            "publisher": "Signet Classic",
            "published_year": 1949,
            "total_copies": 6,
            "available_copies": 6,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Science Fiction
        {
            "title": "Dune",
            "author": "Frank Herbert",
            "isbn": "978-0441172719",
            "category": "Science Fiction",
            "description": "Set in the distant future, Dune tells the story of Paul Atreides on the desert planet Arrakis.",
            "publisher": "Ace",
            "published_year": 1965,
            "total_copies": 3,
            "available_copies": 3,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "The Hitchhiker's Guide to the Galaxy",
            "author": "Douglas Adams",
            "isbn": "978-0345391803",
            "category": "Science Fiction",
            "description": "A comedic science fiction series following Arthur Dent's adventures through space.",
            "publisher": "Del Rey",
            "published_year": 1979,
            "total_copies": 4,
            "available_copies": 4,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Ender's Game",
            "author": "Orson Scott Card",
            "isbn": "978-0812550702",
            "category": "Science Fiction",
            "description": "A young genius is recruited to lead humanity's military against an alien threat.",
            "publisher": "Tor Books",
            "published_year": 1985,
            "total_copies": 3,
            "available_copies": 3,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780812550702-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Mystery
        {
            "title": "The Girl with the Dragon Tattoo",
            "author": "Stieg Larsson",
            "isbn": "978-0307454546",
            "category": "Mystery",
            "description": "A journalist and a hacker investigate a wealthy family's dark secrets.",
            "publisher": "Vintage Crime",
            "published_year": 2005,
            "total_copies": 4,
            "available_copies": 4,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780307454546-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Gone Girl",
            "author": "Gillian Flynn",
            "isbn": "978-0307588371",
            "category": "Mystery",
            "description": "A wife disappears on her wedding anniversary, and suspicion falls on her husband.",
            "publisher": "Crown",
            "published_year": 2012,
            "total_copies": 3,
            "available_copies": 3,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Non-Fiction
        {
            "title": "Sapiens: A Brief History of Humankind",
            "author": "Yuval Noah Harari",
            "isbn": "978-0062316097",
            "category": "Non-Fiction",
            "description": "A narrative history of humanity from the Stone Age to the present.",
            "publisher": "Harper",
            "published_year": 2015,
            "total_copies": 5,
            "available_copies": 5,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Atomic Habits",
            "author": "James Clear",
            "isbn": "978-0735211292",
            "category": "Non-Fiction",
            "description": "An easy and proven way to build good habits and break bad ones.",
            "publisher": "Avery",
            "published_year": 2018,
            "total_copies": 6,
            "available_copies": 6,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Technology
        {
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "isbn": "978-0132350884",
            "category": "Technology",
            "description": "A handbook of agile software craftsmanship for writing clean, readable code.",
            "publisher": "Prentice Hall",
            "published_year": 2008,
            "total_copies": 4,
            "available_copies": 4,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "The Pragmatic Programmer",
            "author": "David Thomas, Andrew Hunt",
            "isbn": "978-0135957059",
            "category": "Technology",
            "description": "A guide to becoming a better programmer through practical advice and techniques.",
            "publisher": "Addison-Wesley",
            "published_year": 2019,
            "total_copies": 3,
            "available_copies": 3,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Introduction to Algorithms",
            "author": "Thomas H. Cormen",
            "isbn": "978-0262033848",
            "category": "Technology",
            "description": "The essential text for computer science algorithms courses.",
            "publisher": "MIT Press",
            "published_year": 2009,
            "total_copies": 2,
            "available_copies": 2,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        # Biography
        {
            "title": "Steve Jobs",
            "author": "Walter Isaacson",
            "isbn": "978-1451648539",
            "category": "Biography",
            "description": "The exclusive biography of Apple co-founder Steve Jobs.",
            "publisher": "Simon & Schuster",
            "published_year": 2011,
            "total_copies": 3,
            "available_copies": 3,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "title": "Becoming",
            "author": "Michelle Obama",
            "isbn": "978-1524763138",
            "category": "Biography",
            "description": "A memoir by the former First Lady of the United States.",
            "publisher": "Crown",
            "published_year": 2018,
            "total_copies": 4,
            "available_copies": 4,
            "cover_image": "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]

    # Clear existing books
    db.books.delete_many({})

    # Insert books
    result = db.books.insert_many(books)
    print(f"Created {len(result.inserted_ids)} books")

    return result.inserted_ids

def seed_checkouts(db, user_ids, book_ids):
    """Create sample checkouts for testing."""

    # Get member user (index 2 is Mike Member)
    member_id = str(user_ids[2])
    jane_id = str(user_ids[3])

    checkouts = [
        # Active checkout for Mike
        {
            "user_id": member_id,
            "book_id": str(book_ids[0]),  # The Great Gatsby
            "checkout_date": datetime.utcnow() - timedelta(days=7),
            "due_date": datetime.utcnow() + timedelta(days=7),
            "return_date": None,
            "status": "active",
            "renewal_count": 0,
            "created_at": datetime.utcnow()
        },
        # Overdue checkout for Mike
        {
            "user_id": member_id,
            "book_id": str(book_ids[3]),  # Dune
            "checkout_date": datetime.utcnow() - timedelta(days=20),
            "due_date": datetime.utcnow() - timedelta(days=6),
            "return_date": None,
            "status": "active",
            "renewal_count": 0,
            "created_at": datetime.utcnow()
        },
        # Returned checkout for Jane
        {
            "user_id": jane_id,
            "book_id": str(book_ids[1]),  # To Kill a Mockingbird
            "checkout_date": datetime.utcnow() - timedelta(days=30),
            "due_date": datetime.utcnow() - timedelta(days=16),
            "return_date": datetime.utcnow() - timedelta(days=18),
            "status": "returned",
            "renewal_count": 0,
            "created_at": datetime.utcnow()
        },
        # Active checkout for Jane
        {
            "user_id": jane_id,
            "book_id": str(book_ids[8]),  # Sapiens
            "checkout_date": datetime.utcnow() - timedelta(days=3),
            "due_date": datetime.utcnow() + timedelta(days=11),
            "return_date": None,
            "status": "active",
            "renewal_count": 0,
            "created_at": datetime.utcnow()
        }
    ]

    # Clear existing checkouts
    db.checkouts.delete_many({})

    # Insert checkouts
    result = db.checkouts.insert_many(checkouts)
    print(f"Created {len(result.inserted_ids)} checkouts")

    # Update book availability for active checkouts
    db.books.update_one({"_id": book_ids[0]}, {"$inc": {"available_copies": -1}})
    db.books.update_one({"_id": book_ids[3]}, {"$inc": {"available_copies": -1}})
    db.books.update_one({"_id": book_ids[8]}, {"$inc": {"available_copies": -1}})
    print("Updated book availability")

    return result.inserted_ids

def seed_reservations(db, user_ids, book_ids):
    """Create sample reservations for testing."""

    john_id = str(user_ids[4])

    reservations = [
        {
            "user_id": john_id,
            "book_id": str(book_ids[3]),  # Dune (currently checked out)
            "reservation_date": datetime.utcnow() - timedelta(days=2),
            "status": "active",
            "expiry_date": datetime.utcnow() + timedelta(days=5),
            "notified": False,
            "created_at": datetime.utcnow()
        }
    ]

    # Clear existing reservations
    db.reservations.delete_many({})

    # Insert reservations
    result = db.reservations.insert_many(reservations)
    print(f"Created {len(result.inserted_ids)} reservations")

    return result.inserted_ids

def main():
    print("=" * 50)
    print("Library Database Seed Script")
    print("=" * 50)
    print()

    # Connect to database
    print("Connecting to MongoDB...")
    connect_db()
    db = get_db()
    print(f"Connected to database: {db.name}")
    print()

    # Seed data
    print("Seeding users...")
    user_ids = seed_users(db)
    print()

    print("Seeding books...")
    book_ids = seed_books(db)
    print()

    print("Seeding checkouts...")
    seed_checkouts(db, user_ids, book_ids)
    print()

    print("Seeding reservations...")
    seed_reservations(db, user_ids, book_ids)
    print()

    print("=" * 50)
    print("Database seeded successfully!")
    print("=" * 50)
    print()
    print("Test Accounts Created:")
    print("-" * 50)
    print("Admin:     admin@library.com     / admin123")
    print("Librarian: librarian@library.com / librarian123")
    print("Member:    member@library.com    / member123")
    print("Member:    jane@example.com      / jane123")
    print("Member:    john@example.com      / john123")
    print("-" * 50)
    print()
    print(f"Total Books: {db.books.count_documents({})}")
    print(f"Total Users: {db.users.count_documents({})}")
    print(f"Active Checkouts: {db.checkouts.count_documents({'status': 'active'})}")
    print(f"Active Reservations: {db.reservations.count_documents({'status': 'active'})}")

if __name__ == "__main__":
    main()
