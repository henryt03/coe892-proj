from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class RatingBase(BaseModel):
    book_id: str
    rating: int = Field(..., ge=1, le=5)  # 1-5 stars
    review: Optional[str] = None

class RatingCreate(RatingBase):
    pass

class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None

class RatingResponse(RatingBase):
    id: str = Field(alias="_id")
    user_id: str
    user_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
