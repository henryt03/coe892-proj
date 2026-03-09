from fastapi import APIRouter, HTTPException, Query, Depends
from models.book import BookCreate, BookUpdate, BookResponse
from middleware.auth import get_current_user, require_role
from config.database import get_db
from datetime import datetime
from bson import ObjectId
from typing import List, Optional

router = APIRouter()

@router.get("", response_model=List[BookResponse])
async def get_books(
    search: Optional[str] = None,
    category: Optional[str] = None,
    available: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
):
    db = get_db()
    
    # Build filter
    filter_dict = {}
    if search:
        filter_dict["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    if category:
        filter_dict["category"] = category
    if available:
        filter_dict["available_copies"] = {"$gt": 0}
    
    # Query books
    books = list(db.books.find(filter_dict).skip(skip).limit(limit))
    for book in books:
        book["_id"] = str(book["_id"])
    
    return books

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    db = get_db()
    
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    book = db.books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    book["_id"] = str(book["_id"])
    return book

@router.post("", response_model=BookResponse, status_code=201)
async def create_book(
    book: BookCreate,
    current_user: dict = Depends(require_role("librarian"))
):
    db = get_db()
    
    book_dict = book.dict()
    book_dict["created_at"] = datetime.utcnow()
    
    result = db.books.insert_one(book_dict)
    created_book = db.books.find_one({"_id": result.inserted_id})
    created_book["_id"] = str(created_book["_id"])
    
    return created_book

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: str,
    book: BookUpdate,
    current_user: dict = Depends(require_role("librarian"))
):
    db = get_db()
    
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    # Update only provided fields
    update_data = {k: v for k, v in book.dict().items() if v is not None}
    
    if update_data:
        db.books.update_one({"_id": ObjectId(book_id)}, {"$set": update_data})
    
    updated_book = db.books.find_one({"_id": ObjectId(book_id)})
    if not updated_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    updated_book["_id"] = str(updated_book["_id"])
    return updated_book

@router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    db = get_db()
    
    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    result = db.books.delete_one({"_id": ObjectId(book_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return None