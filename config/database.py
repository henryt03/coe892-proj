from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = None
db = None

def connect_db():
    global client, db
    MONGO_URI = os.getenv("MONGO_URI")
    
    if not MONGO_URI:
        raise ValueError("MONGO_URI not found in environment variables")
    
    client = MongoClient(MONGO_URI)
    db = client["library_db"]
    print("✅ MongoDB connected successfully")
    return db

def get_db():
    return db