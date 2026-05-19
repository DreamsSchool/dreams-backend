import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(title="Dream's School API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Routing Engine ---
# Render will provide a 'DATABASE_URL' environment variable automatically.
# If it's not found, it falls back to a local SQLite file for your offline testing.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///dreams_school.db")

# Fix for Render/PostgreSQL connection string quirk if using SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def init_db():
    with engine.begin() as conn:
        # Create Users Table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(100) PRIMARY KEY,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(50) NOT NULL, 
                class_name VARCHAR(50) NOT NULL
            )
        '''))
        
        # Create Messages Table
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                target_role VARCHAR(50) NOT NULL, 
                target_class VARCHAR(50) NOT NULL,
                timestamp VARCHAR(100) NOT NULL
            )
        '''))
        
        # Auto-provision Default Admin Profile safely
        conn.execute(text('''
            INSERT INTO users (username, password, role, class_name)
            VALUES ('admin', 'admin123', 'admin', 'ALL')
            ON CONFLICT (username) DO NOTHING
        '''))

init_db()

# --- Data Models ---
class LoginData(BaseModel):
    username: str
    password: str

class CreateUserData(BaseModel):
    full_name: str
    phone: str
    role: str # 'parent' or 'teacher'
    class_name: str # e.g., '10A', '9B', or 'ALL'

class MessageData(BaseModel):
    title: str
    body: str
    target_role: str # 'ALL', 'parent', 'teacher'
    target_class: Optional[str] = "ALL"

# --- API Routes ---

@app.post("/login")
def login(data: LoginData):
    with engine.connect() as conn:
        query = text("SELECT username, password, role, class_name FROM users WHERE username = :u AND password = :p")
        user = conn.execute(query, {"u": data.username.strip().lower(), "p": data.password}).fetchone()
        
    if user:
        return {"status": "success", "role": user[2], "class_name": user[3]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/manage-user")
def create_user(user: CreateUserData):
    # Dynamic Credential generation rules:
    # Full Name to lower, space removed -> username. Phone -> password.
    generated_username = user.full_name.replace(" ", "").lower()
    generated_password = user.phone.strip()
    
    with engine.begin() as conn:
        try:
            conn.execute(text('''
                INSERT INTO users (username, password, role, class_name)
                VALUES (:u, :p, :r, :c)
            '''), {
                "u": generated_username,
                "p": generated_password,
                "r": user.role.strip().lower(),
                "c": user.class_name.strip().upper()
            })
            return {"status": "success", "username": generated_username, "password": generated_password}
        except Exception:
            raise HTTPException(status_code=400, detail="User account creation conflict or duplicate registration.")

@app.post("/send-message")
def send_message(msg: MessageData):
    timestamp = datetime.now().strftime("%d %b %Y, %I:%M %p")
    
    with engine.begin() as conn:
        conn.execute(text('''
            INSERT INTO messages (title, body, target_role, target_class, timestamp) 
            VALUES (:title, :body, :target_role, :target_class, :timestamp)
        '''), {
            "title": msg.title,
            "body": msg.body,
            "target_role": msg.target_role,
            "target_class": msg.target_class,
            "timestamp": timestamp
        })
    return {"status": "success"}

@app.get("/messages/{role}/{class_name}")
def get_messages(role: str, class_name: str):
    with engine.connect() as conn:
        
        # STRICT FILTER: For Parents
        if role == 'parent':
            query = text('''
                SELECT title, body, timestamp FROM messages 
                WHERE target_role = 'ALL' 
                OR (target_role = 'parent' AND target_class = 'ALL')
                OR (target_role = 'parent' AND target_class = :class_name)
                ORDER BY id DESC
            ''')
            
        # STRICT FILTER: For Teachers
        elif role == 'teacher':
            query = text('''
                SELECT title, body, timestamp FROM messages 
                WHERE target_role = 'ALL' 
                OR target_role = 'teacher'
                ORDER BY id DESC
            ''')
            
        # ADMIN: Sees everything they have sent
        else:
            query = text('''
                SELECT title, body, timestamp FROM messages 
                ORDER BY id DESC
            ''')
            
        # Execute the safe query
        messages = conn.execute(query, {"class_name": class_name}).fetchall()
        
    return [{"title": m[0], "body": m[1], "timestamp": m[2]} for m in messages]
