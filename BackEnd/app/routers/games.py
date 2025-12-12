from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, dependencies

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/score", response_model=schemas.ScoreResponse)
def submit_score(
    score: schemas.ScoreCreate, 
    db: Session = Depends(database.get_db),
    current_user = Depends(dependencies.get_current_user)
):
    return crud.create_score(db=db, score=score, user_id=current_user.id)

@router.get("/leaderboard", response_model=List[schemas.ScoreResponse])
def get_leaderboard(limit: int = 10, db: Session = Depends(database.get_db)):
    return crud.get_top_scores(db=db, limit=limit)