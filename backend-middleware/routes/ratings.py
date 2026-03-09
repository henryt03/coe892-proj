from fastapi import APIRouter, HTTPException, Depends
from models.rating import RatingCreate, RatingUpdate, RatingResponse
from middleware.auth import get_current_user
from config.database import get_db
from datetime import datetime
from bson import ObjectId
from typing import List, Optional

router = APIRouter()

@router.post("", response_model=RatingResponse, status_code=201)
async def create_rating(
    rating: RatingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update a rating for a book"""
    db = get_db()
    user_id = current_user["user_id"]

    # Verify book exists
    if not ObjectId.is_valid(rating.book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")

    book = db.books.find_one({"_id": ObjectId(rating.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Check if user already rated this book
    existing = db.ratings.find_one({
        "user_id": user_id,
        "book_id": rating.book_id
    })

    if existing:
        # Update existing rating
        db.ratings.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "rating": rating.rating,
                    "review": rating.review,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        updated = db.ratings.find_one({"_id": existing["_id"]})
        updated["_id"] = str(updated["_id"])
        return updated

    # Get user's name for the rating
    user = db.users.find_one({"_id": ObjectId(user_id)})
    user_name = user["name"] if user else "Anonymous"

    # Create new rating
    rating_dict = {
        "user_id": user_id,
        "book_id": rating.book_id,
        "rating": rating.rating,
        "review": rating.review,
        "user_name": user_name,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }

    result = db.ratings.insert_one(rating_dict)
    created = db.ratings.find_one({"_id": result.inserted_id})
    created["_id"] = str(created["_id"])

    return created


@router.get("/book/{book_id}", response_model=List[RatingResponse])
async def get_book_ratings(book_id: str):
    """Get all ratings for a book"""
    db = get_db()

    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")

    ratings = list(db.ratings.find({"book_id": book_id}).sort("created_at", -1))
    for rating in ratings:
        rating["_id"] = str(rating["_id"])

    return ratings


@router.get("/book/{book_id}/average")
async def get_book_average_rating(book_id: str):
    """Get average rating for a book"""
    db = get_db()

    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")

    pipeline = [
        {"$match": {"book_id": book_id}},
        {
            "$group": {
                "_id": "$book_id",
                "average_rating": {"$avg": "$rating"},
                "total_ratings": {"$sum": 1}
            }
        }
    ]

    result = list(db.ratings.aggregate(pipeline))

    if not result:
        return {"average_rating": 0, "total_ratings": 0}

    return {
        "average_rating": round(result[0]["average_rating"], 1),
        "total_ratings": result[0]["total_ratings"]
    }


@router.get("/my", response_model=List[RatingResponse])
async def get_my_ratings(current_user: dict = Depends(get_current_user)):
    """Get current user's ratings"""
    db = get_db()

    ratings = list(db.ratings.find({"user_id": current_user["user_id"]}).sort("created_at", -1))
    for rating in ratings:
        rating["_id"] = str(rating["_id"])

    return ratings


@router.get("/my/{book_id}")
async def get_my_rating_for_book(
    book_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's rating for a specific book"""
    db = get_db()

    if not ObjectId.is_valid(book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID")

    rating = db.ratings.find_one({
        "user_id": current_user["user_id"],
        "book_id": book_id
    })

    if not rating:
        return None

    rating["_id"] = str(rating["_id"])
    return rating


@router.delete("/{rating_id}", status_code=204)
async def delete_rating(
    rating_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a rating"""
    db = get_db()

    if not ObjectId.is_valid(rating_id):
        raise HTTPException(status_code=400, detail="Invalid rating ID")

    result = db.ratings.delete_one({
        "_id": ObjectId(rating_id),
        "user_id": current_user["user_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rating not found")

    return None
