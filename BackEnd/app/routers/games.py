from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, dependencies, models

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/score", response_model=schemas.ScoreResponse)
def submit_score(
    score: schemas.ScoreCreate, 
    current_user: models.User = Depends(dependencies.get_current_user), # ¡Aquí usamos la dependencia!
    db: Session = Depends(database.get_db)
):
    # Ahora 'current_user' tiene toda la info del usuario logueado
    return crud.create_score(db=db, score=score, user_id=current_user.id)

@router.get("/leaderboard", response_model=List[schemas.ScoreResponse])
def get_leaderboard(db: Session = Depends(database.get_db)):
    return crud.get_top_scores(db=db)