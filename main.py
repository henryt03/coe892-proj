from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import connect_db
from routes import auth, books, checkouts, reservations
import uvicorn

app = FastAPI(title="Library Management API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
@app.on_event("startup")
async def startup_db():
    connect_db()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/api/books", tags=["Books"])
app.include_router(checkouts.router, prefix="/api/checkouts", tags=["Checkouts"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservations"])

@app.get("/")
def root():
    return {"message": "Library Management API", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)