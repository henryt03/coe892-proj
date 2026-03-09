from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from config.database import get_db
from bson import ObjectId

router = APIRouter()

@router.get("/{user_id}")
async def get_recommendations(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    # Get user's checkout history
    checkouts = list(db.checkouts.find({"user_id": user_id}))
    
    # Get categories from checked out books
    book_ids = [ObjectId(c["book_id"]) for c in checkouts]
    books = list(db.books.find({"_id": {"$in": book_ids}}))
    
    categories = list(set([book["category"] for book in books]))
    
    # Find books in same categories that user hasn't checked out
    recommendations = list(db.books.find({
        "category": {"$in": categories},
        "_id": {"$nin": book_ids},
        "available_copies": {"$gt": 0}
    }).limit(10))
    
    for book in recommendations:
        book["_id"] = str(book["_id"])
    
    return recommendations
