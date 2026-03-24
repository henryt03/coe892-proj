General side notes:

ADMIN LOGIN for libraryDBMS:
Email: admin@library.com
Password: admin123

Setup:
1. Create .venv (optional)
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python.exe -m pip install --upgrade pip

2. Ensure you create .env

# JWT Configuration
# random secret key JWT_SECRET
JWT_SECRET= "random key"
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

Steps to run:
# Terminal 1:
cd backend-middleware && python main.py

# Terminal 2:
cd frontend && npm run dev

Deployment notes:

- Backend CORS is controlled by `CORS_ORIGINS` (comma-separated).
- Example:
  - `CORS_ORIGINS=http://localhost:3000,https://your-frontend.onrender.com`
- Render preview/frontends on `*.onrender.com` are also allowed by regex in backend middleware.
