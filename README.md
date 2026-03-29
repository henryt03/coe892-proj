General side notes:

ADMIN LOGIN for libraryDBMS:
Email: admin@library.com
Password: admin123

Setup:

1. Setup .venv (optional but recommended)
   cd backend-middleware
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   python.exe -m pip install --upgrade pip

2. Ensure you create .env in 'backend-middleware' folder (check discord for .env file)
   MONGO_URI= personal connection
   JWT_SECRET= random key (you can generate from online)

Steps to run:

1. Terminal 1:
   cd backend-middleware
   python main.py

2. Terminal 2:
   cd frontend
   npm i
   npm update
   npm run dev

NOTE: The frontend is deployed on vercel @ https://coe892-proj2-s8cy-5rd7k9i59-asad-kamals-projects.vercel.app/home, all features can be accessed through that link instead of running locally.
