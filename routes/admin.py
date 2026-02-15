from fastapi import APIRouter, Depends
from middleware.auth import require_role
from config.database import get_db
from datetime import datetime

router = APIRouter()

@router.get("/stats")
async def get_stats(current_user: dict = Depends(require_role("librarian"))):
    db = get_db()
    
    total_books = db.books.count_documents({})
    total_users = db.users.count_documents({})
    active_checkouts = db.checkouts.count_documents({"status": "active"})
    overdue = db.checkouts.count_documents({
        "status": "active",
        "due_date": {"$lt": datetime.utcnow()}
    })
    
    return {
        "total_books": total_books,
        "total_users": total_users,
        "active_checkouts": active_checkouts,
        "overdue_checkouts": overdue
    }

@router.get("/overdue")
async def get_overdue_books(current_user: dict = Depends(require_role("librarian"))):
    db = get_db()
    
    overdue = list(db.checkouts.find({
        "status": "active",
        "due_date": {"$lt": datetime.utcnow()}
    }))
    
    for checkout in overdue:
        checkout["_id"] = str(checkout["_id"])
    
    return overdue