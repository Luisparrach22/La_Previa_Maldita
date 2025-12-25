from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
import uuid

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)

# Ensure uploads directory exists within static
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    """
    Subir una imagen al servidor y obtener su URL.
    Soporta: jpeg, png, webp, gif.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate URL (Assuming static is mounted at /static)
        # Note: In production this should be a full URL domain
        file_url = f"http://localhost:8000/static/uploads/{unique_filename}"

        return {"url": file_url, "filename": unique_filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")
