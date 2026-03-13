from fastapi import APIRouter, HTTPException, Depends
from models.checkout import CheckoutCreate, CheckoutResponse
from middleware.auth import get_current_user
from config.database import get_db
from datetime import datetime, timedelta
from bson import ObjectId
from typing import List

router = APIRouter()

@router.post("", response_model=CheckoutResponse, status_code=201)
async def checkout_book(
    checkout: CheckoutCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    # Validate book_id format
    if not ObjectId.is_valid(checkout.book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    # Check if book exists and is available
    book = db.books.find_one({"_id": ObjectId(checkout.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book["available_copies"] <= 0:
        raise HTTPException(status_code=400, detail="Book not available")
    
    # Check if user already has this book
    existing = db.checkouts.find_one({
        "user_id": checkout.user_id,
        "book_id": checkout.book_id,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have this book checked out")
    
    # Create checkout
    checkout_dict = {
        "user_id": checkout.user_id,
        "book_id": checkout.book_id,
        "checkout_date": datetime.utcnow(),
        "due_date": datetime.utcnow() + timedelta(days=14),  # 2 weeks
        "return_date": None,
        "status": "active",
        "renewal_count": 0
    }
    
    result = db.checkouts.insert_one(checkout_dict)
    
    # Update book availability
    db.books.update_one(
        {"_id": ObjectId(checkout.book_id)},
        {"$inc": {"available_copies": -1}}
    )
    
    created_checkout = db.checkouts.find_one({"_id": result.inserted_id})
    created_checkout["_id"] = str(created_checkout["_id"])
    
    return created_checkout

@router.get("/my", response_model=List[CheckoutResponse])
async def get_my_checkouts(current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    checkouts = list(db.checkouts.find({"user_id": current_user["user_id"]}))
    for checkout in checkouts:
        checkout["_id"] = str(checkout["_id"])
    
    return checkouts

@router.put("/{checkout_id}/return", response_model=CheckoutResponse)
async def return_book(
    checkout_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    if not ObjectId.is_valid(checkout_id):
        raise HTTPException(status_code=400, detail="Invalid checkout ID")
    
    checkout = db.checkouts.find_one({"_id": ObjectId(checkout_id)})
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    
    if checkout["status"] != "active":
        raise HTTPException(status_code=400, detail="Book already returned")
    
    # Update checkout
    db.checkouts.update_one(
        {"_id": ObjectId(checkout_id)},
        {"$set": {"return_date": datetime.utcnow(), "status": "returned"}}
    )
    
    # Update book availability
    db.books.update_one(
        {"_id": ObjectId(checkout["book_id"])},
        {"$inc": {"available_copies": 1}}
    )
    
    updated_checkout = db.checkouts.find_one({"_id": ObjectId(checkout_id)})
    updated_checkout["_id"] = str(updated_checkout["_id"])
    
    return updated_checkout

@router.post("/{checkout_id}/renew", response_model=CheckoutResponse)
async def renew_checkout(
    checkout_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    
    if not ObjectId.is_valid(checkout_id):
        raise HTTPException(status_code=400, detail="Invalid checkout ID")
    
    checkout = db.checkouts.find_one({"_id": ObjectId(checkout_id)})
    if not checkout:
        raise HTTPException(status_code=404, detail="Checkout not found")
    
    if checkout["renewal_count"] >= 2:
        raise HTTPException(status_code=400, detail="Maximum renewals reached")
    
    # Extend due date by 14 days
    new_due_date = checkout["due_date"] + timedelta(days=14)
    
    db.checkouts.update_one(
        {"_id": ObjectId(checkout_id)},
        {
            "$set": {"due_date": new_due_date},
            "$inc": {"renewal_count": 1}
        }
    )
    
    updated_checkout = db.checkouts.find_one({"_id": ObjectId(checkout_id)})
    updated_checkout["_id"] = str(updated_checkout["_id"])
    
    return updated_checkout