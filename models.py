from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean 
from sqlalchemy.sql import func 
 
from database.database import Base 
 
 
# ========================================================= 
# USER 
# ========================================================= 
 
class User(Base): 
    __tablename__ = "users" 
 
    id = Column(Integer, primary_key=True, index=True) 
 
    username = Column( 
        String(100), 
        unique=True, 
        nullable=False 
    ) 
 
    email = Column( 
        String(255), 
        unique=True, 
        nullable=False 
    ) 
 
    password = Column( 
        String(255), 
        nullable=False 
    ) 
 
    total_attempts = Column( 
        Integer, 
        default=0 
    ) 
 
    total_correct = Column( 
        Integer, 
        default=0 
    ) 
 
    accuracy = Column( 
        Float, 
        default=0.0 
    ) 
 
    xp = Column( 
        Integer, 
        default=0 
    ) 
 
    level = Column( 
        String(50), 
        default="Beginner" 
    ) 
 
 
# ========================================================= 
# PREDICTION HISTORY 
# ========================================================= 
 
class PredictionHistory(Base): 
    __tablename__ = "prediction_history" 
 
    id = Column( 
        Integer, 
        primary_key=True, 
        index=True 
    ) 
 
    prediction = Column( 
        String(100), 
        nullable=False 
    ) 
 
    confidence = Column( 
        Float, 
        default=0.0 
    ) 
 
    user_id = Column( 
        Integer, 
        nullable=False 
    ) 
 
    created_at = Column( 
        DateTime, 
        server_default=func.now() 
    ) 
 
 
# ========================================================= 
# PRACTICE ATTEMPT 
# ========================================================= 
 
class PracticeAttempt(Base): 
    __tablename__ = "practice_attempts" 
 
    id = Column( 
        Integer, 
        primary_key=True, 
        index=True 
    ) 
 
    user_id = Column( 
        Integer, 
        nullable=False 
    ) 
 
    target = Column( 
        String(100), 
        nullable=False 
    ) 
 
    prediction = Column( 
        String(100), 
        nullable=False 
    ) 
 
    confidence = Column( 
        Float, 
        default=0.0 
    ) 
 
    difficulty = Column( 
        String(20), 
        default="easy" 
    ) 
 
    correct = Column( 
        Boolean, 
        default=False 
    ) 
 
    practice_type = Column( 
        String(50), 
        default="letter" 
    ) 
 
    feedback = Column( 
        String(500), 
        nullable=True 
    ) 
 
    timestamp = Column( 
        DateTime, 
        server_default=func.now() 
    ) 
 
 
# ========================================================= 
# USER PROGRESS 
# ========================================================= 
 
class UserProgress(Base): 
    __tablename__ = "user_progress" 
 
    id = Column( 
        Integer, 
        primary_key=True, 
        index=True 
    ) 
 
    user_id = Column( 
        Integer, 
        nullable=False, 
        unique=True 
    ) 
 
    xp = Column( 
        Integer, 
        default=0 
    ) 
 
    level = Column( 
        String(50), 
        default="Beginner" 
    ) 
 
    streak = Column( 
        Integer, 
        default=0 
    ) 
 
    best_accuracy = Column( 
        Float, 
        default=0.0 
    ) 
 
    sessions = Column( 
        Integer, 
        default=0 
    ) 