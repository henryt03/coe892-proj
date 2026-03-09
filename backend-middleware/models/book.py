from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    category: str
    description: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None
    total_copies: int = 1
    available_copies: int = 1
    cover_image: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    cover_image: Optional[str] = None

class BookResponse(BookBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}