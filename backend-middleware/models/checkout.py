from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class CheckoutBase(BaseModel):
    user_id: str
    book_id: str

class CheckoutCreate(CheckoutBase):
    pass

class CheckoutUpdate(BaseModel):
    return_date: Optional[datetime] = None
    status: Optional[str] = None

class CheckoutResponse(CheckoutBase):
    id: str = Field(alias="_id")
    checkout_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str  # "active", "returned", "overdue"
    renewal_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}