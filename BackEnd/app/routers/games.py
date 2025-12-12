from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, database, dependencies

router = APIRouter(
    prefix="/games",
    tags=["games"],
)

@router.post("/score", response_model=schemas.GameScoreResponse)
def submit_score(
    score: schemas.GameScoreCreate, 
    db: Session = Depends(database.get_db),
    current_user = Depends(dependencies.get_current_user)
):
    # El usuario debe estar logueado para guardar su puntuación
    return crud.create_game_score(db=db, score=score, user_id=current_user.id)

@router.get("/highscores/{game_name}", response_model=List[schemas.GameScoreResponse])
def get_leaderboard(game_name: str, limit: int = 10, db: Session = Depends(database.get_db)):
    return crud.get_high_scores(db=db, game_name=game_name, limit=limit)