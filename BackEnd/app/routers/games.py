from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database, dependencies, models

router = APIRouter(
    prefix="/games",
    tags=["Games & Scores"],
    responses={404: {"description": "No encontrado"}},
)


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.get("/leaderboard", response_model=List[schemas.ScoreResponse])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=100, description="Número de mejores puntuaciones a mostrar"),
    db: Session = Depends(database.get_db)
):
    """
    Obtener el leaderboard con las mejores puntuaciones.
    
    - **limit**: Número de posiciones a mostrar (máximo 100)
    """
    return crud.get_top_scores(db=db, limit=limit)


# ============================================================================
# AUTHENTICATED USER ENDPOINTS
# ============================================================================

@router.post("/score", response_model=schemas.ScoreResponse, status_code=status.HTTP_201_CREATED)
def submit_score(
    score: schemas.ScoreCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Guardar una nueva puntuación del usuario actual.
    
    - **points**: Puntos obtenidos en el juego
    """
    # Guardar puntuación
    new_score = crud.create_score(db=db, score=score, user_id=current_user.id)
    
    # ---------------------------------------------------------
    # GAMIFICATION: Sumar puntos al saldo del usuario
    # ---------------------------------------------------------
    # Por simplicidad, 1 punto de score = 1 Alma
    current_user.soul_balance += score.points
    db.commit()
    db.refresh(current_user)
    
    return new_score


@router.get("/my-scores", response_model=List[schemas.ScoreResponse])
def get_my_scores(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Obtener las puntuaciones del usuario actual.
    """
    return crud.get_scores_by_user(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/my-best", response_model=schemas.ScoreResponse)
def get_my_best_score(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Obtener la mejor puntuación del usuario actual.
    """
    best_score = crud.get_user_best_score(db=db, user_id=current_user.id)
    if not best_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aún no tienes puntuaciones registradas"
        )
    return best_score


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@router.get("/scores", response_model=List[schemas.ScoreResponse])
def get_all_scores(
    skip: int = 0,
    limit: int = 100,
    user_id: int = Query(None, description="Filtrar por ID de usuario"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener todas las puntuaciones. **Solo administradores.**
    
    - **user_id**: Opcional, filtrar por usuario específico
    """
    if user_id:
        return crud.get_scores_by_user(db=db, user_id=user_id, skip=skip, limit=limit)
    return crud.get_scores(db=db, skip=skip, limit=limit)


@router.get("/scores/{score_id}", response_model=schemas.ScoreResponse)
def get_score(
    score_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Obtener una puntuación específica por ID. **Solo administradores.**
    """
    db_score = crud.get_score(db, score_id=score_id)
    if db_score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puntuación no encontrada"
        )
    return db_score


@router.put("/scores/{score_id}", response_model=schemas.ScoreResponse)
def update_score(
    score_id: int,
    score_update: schemas.ScoreUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Actualizar una puntuación. **Solo administradores.**
    """
    db_score = crud.update_score(db, score_id, score_update)
    if db_score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puntuación no encontrada"
        )
    return db_score


@router.delete("/scores/{score_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_score(
    score_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_admin_user)
):
    """
    Eliminar una puntuación. **Solo administradores.**
    """
    success = crud.delete_score(db, score_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puntuación no encontrada"
        )
    return None