from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta, timezone
from app.db.mongodb import users_collection, blacklist_collection
from app.config import settings

router = APIRouter()

# Setup password hashing and JWT
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Pydantic Models
class UserAuth(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserAuth):
    # Check if user exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and save
    hashed_password = pwd_context.hash(user.password)
    users_collection.insert_one({"email": user.email, "password": hashed_password})
    
    return {"message": "Signup successful. Please login."}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm maps the email to 'username'
    db_user = users_collection.find_one({"email": form_data.username})
    if not db_user or not pwd_context.verify(form_data.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate JWT token
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    token = jwt.encode({"sub": form_data.username, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer", "message": "Login successful"}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Calculate exact expiration for MongoDB TTL
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    blacklist_collection.insert_one({
        "token": token, 
        "expires_at": expires_at
    })
    return {"message": "Secure logout successful. Token invalidated."}

# Dependency Function
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # 1. Check if token is in the blacklist
    if blacklist_collection.find_one({"token": token}):
        raise HTTPException(status_code=401, detail="Token blacklisted. Please log in again.")
    
    # 2. Decode token and verify
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return email
    except HTTPException:
        raise  # let FastAPI handle it
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Standard /me Route
@router.get("/me")
async def get_me(current_user: str = Depends(get_current_user)):
    return {"user_email": current_user}