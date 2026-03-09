from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class ReservationBase(BaseModel):
    user_id: str
    book_id: str

class ReservationCreate(ReservationBase):
    pass

class ReservationResponse(ReservationBase):
    id: str = Field(alias="_id")
    reservation_date: datetime
    status: str  # "active", "fulfilled", "cancelled", "expired"
    expiry_date: Optional[datetime] = None
    notified: bool = False
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}