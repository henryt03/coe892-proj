from fastapi import APIRouter, HTTPException, Depends
from middleware.auth import get_current_user
from config.database import get_db
from datetime import datetime
from bson import ObjectId
from typing import List
from pydantic import BaseModel


class ReservationCreate(BaseModel):
    book_id: str
    user_id: str


router = APIRouter()


@router.post("")
async def create_reservation(
    reservation: ReservationCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    # Validate book_id format
    if not ObjectId.is_valid(reservation.book_id):
        raise HTTPException(status_code=400, detail="Invalid book ID format")

    # Check if book exists
    book = db.books.find_one({"_id": ObjectId(reservation.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Check if user already has reservation
    existing = db.reservations.find_one({
        "user_id": reservation.user_id,
        "book_id": reservation.book_id,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a reservation for this book")

    reservation_dict = {
        "user_id": reservation.user_id,
        "book_id": reservation.book_id,
        "reservation_date": datetime.utcnow(),
        "status": "active"
    }

    result = db.reservations.insert_one(reservation_dict)
    created = db.reservations.find_one({"_id": result.inserted_id})
    created["_id"] = str(created["_id"])

    return created


@router.get("/my")
async def get_my_reservations(current_user: dict = Depends(get_current_user)):
    db = get_db()

    reservations = list(db.reservations.find({"user_id": current_user["user_id"]}))
    for res in reservations:
        res["_id"] = str(res["_id"])

    return reservations


@router.delete("/{reservation_id}")
async def cancel_reservation(
    reservation_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()

    # Validate reservation_id format
    if not ObjectId.is_valid(reservation_id):
        raise HTTPException(status_code=400, detail="Invalid reservation ID format")

    result = db.reservations.delete_one({
        "_id": ObjectId(reservation_id),
        "user_id": current_user["user_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reservation not found")

    return {"message": "Reservation cancelled"}