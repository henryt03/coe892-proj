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
    """
    Get personalized book recommendations based on:
    1. User's highly rated books (4-5 stars) - find similar categories
    2. User's checkout history - find related categories
    3. Highly rated books by other users in the same categories
    """
    db = get_db()

    # Get user's ratings (especially high ratings)
    user_ratings = list(db.ratings.find({"user_id": user_id}))
    highly_rated_book_ids = [
        ObjectId(r["book_id"]) for r in user_ratings if r["rating"] >= 4
    ]

    # Get user's checkout history
    checkouts = list(db.checkouts.find({"user_id": user_id}))
    checked_out_book_ids = [ObjectId(c["book_id"]) for c in checkouts]

    # Combine book IDs the user has interacted with
    all_interacted_ids = list(set(highly_rated_book_ids + checked_out_book_ids))

    # Get books user has interacted with
    interacted_books = list(db.books.find({"_id": {"$in": all_interacted_ids}}))

    # Extract categories, weighted by rating
    category_weights = {}
    for book in interacted_books:
        cat = book["category"]
        # Check if this book was highly rated
        book_id_str = str(book["_id"])
        user_rating = next(
            (r for r in user_ratings if r["book_id"] == book_id_str),
            None
        )
        # Weight: highly rated = 3, rated = 2, just checked out = 1
        if user_rating and user_rating["rating"] >= 4:
            weight = 3
        elif user_rating:
            weight = 2
        else:
            weight = 1
        category_weights[cat] = category_weights.get(cat, 0) + weight

    # Sort categories by weight
    sorted_categories = sorted(
        category_weights.keys(),
        key=lambda x: category_weights[x],
        reverse=True
    )

    if not sorted_categories:
        # No history - return highly rated books overall
        pipeline = [
            {"$group": {
                "_id": "$book_id",
                "avg_rating": {"$avg": "$rating"},
                "num_ratings": {"$sum": 1}
            }},
            {"$match": {"num_ratings": {"$gte": 1}}},
            {"$sort": {"avg_rating": -1, "num_ratings": -1}},
            {"$limit": 10}
        ]
        top_rated = list(db.ratings.aggregate(pipeline))
        top_book_ids = [ObjectId(r["_id"]) for r in top_rated]

        recommendations = list(db.books.find({
            "_id": {"$in": top_book_ids},
            "available_copies": {"$gt": 0}
        }))

        for book in recommendations:
            book["_id"] = str(book["_id"])
            # Add average rating info
            rating_info = next(
                (r for r in top_rated if r["_id"] == str(book["_id"])),
                None
            )
            if rating_info:
                book["avg_rating"] = round(rating_info["avg_rating"], 1)
                book["num_ratings"] = rating_info["num_ratings"]

        return recommendations

    # Find books in preferred categories that user hasn't interacted with
    all_interacted_str = [str(bid) for bid in all_interacted_ids]

    recommendations = []
    for category in sorted_categories[:3]:  # Top 3 categories
        # Get books in this category
        category_books = list(db.books.find({
            "category": category,
            "_id": {"$nin": all_interacted_ids},
            "available_copies": {"$gt": 0}
        }).limit(5))

        for book in category_books:
            book_id_str = str(book["_id"])
            book["_id"] = book_id_str

            # Get average rating for this book
            pipeline = [
                {"$match": {"book_id": book_id_str}},
                {"$group": {
                    "_id": "$book_id",
                    "avg_rating": {"$avg": "$rating"},
                    "num_ratings": {"$sum": 1}
                }}
            ]
            rating_result = list(db.ratings.aggregate(pipeline))
            if rating_result:
                book["avg_rating"] = round(rating_result[0]["avg_rating"], 1)
                book["num_ratings"] = rating_result[0]["num_ratings"]
            else:
                book["avg_rating"] = 0
                book["num_ratings"] = 0

            book["recommendation_reason"] = f"Based on your interest in {category}"
            recommendations.append(book)

    # Sort by average rating, then by number of ratings
    recommendations.sort(
        key=lambda x: (x.get("avg_rating", 0), x.get("num_ratings", 0)),
        reverse=True
    )

    return recommendations[:10]


@router.get("/preferences/{user_id}")
async def get_preference_recommendations(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized book recommendations based on user's preferred genres.

    Algorithm:
    1. Fetch user's preferred_genres from database
    2. Query books in those genres
    3. Exclude books user has already borrowed/rated
    4. Sort by average rating
    5. Return up to 10 recommendations
    """
    db = get_db()

    # Get user's preferred genres
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return []

    preferred_genres = user.get("preferred_genres", [])
    if not preferred_genres:
        return []

    # Get books user has already interacted with
    checkouts = list(db.checkouts.find({"user_id": user_id}))
    checked_out_book_ids = [ObjectId(c["book_id"]) for c in checkouts]

    user_ratings = list(db.ratings.find({"user_id": user_id}))
    rated_book_ids = [ObjectId(r["book_id"]) for r in user_ratings]

    excluded_ids = list(set(checked_out_book_ids + rated_book_ids))

    # Query books matching user's preferred genres
    query = {
        "category": {"$in": preferred_genres},
        "available_copies": {"$gt": 0}
    }
    if excluded_ids:
        query["_id"] = {"$nin": excluded_ids}

    books = list(db.books.find(query).limit(20))

    recommendations = []
    for book in books:
        book_id_str = str(book["_id"])
        book["_id"] = book_id_str

        # Get average rating for this book
        pipeline = [
            {"$match": {"book_id": book_id_str}},
            {"$group": {
                "_id": "$book_id",
                "avg_rating": {"$avg": "$rating"},
                "num_ratings": {"$sum": 1}
            }}
        ]
        rating_result = list(db.ratings.aggregate(pipeline))
        if rating_result:
            book["avg_rating"] = round(rating_result[0]["avg_rating"], 1)
            book["num_ratings"] = rating_result[0]["num_ratings"]
        else:
            book["avg_rating"] = 0
            book["num_ratings"] = 0

        book["recommendation_reason"] = f"Matches your preference for {book['category']}"
        recommendations.append(book)

    # Sort by average rating, then by number of ratings
    recommendations.sort(
        key=lambda x: (x.get("avg_rating", 0), x.get("num_ratings", 0)),
        reverse=True
    )

    return recommendations[:10]
