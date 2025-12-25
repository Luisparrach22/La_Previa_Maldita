from fastapi import APIRouter, UploadFile, File, HTTPException
import aiofiles
import os
import uuid

router = APIRouter(
    prefix="/upload",
    tags=["Uploads"],
)

# Ensure uploads directory exists within static, relative to this file
# BackEnd/app/routers/../static/uploads -> BackEnd/app/static/uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    # 1. Validar que sea una imagen
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # 2. Generar nombre único
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 3. Guardar archivo DE FORMA ASÍNCROMA (no bloquea el server)
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()  # Lectura async
            await out_file.write(content)  # Escritura async
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar imagen: {str(e)}")

    # 4. Devoler URL pública
    return {"url": f"http://localhost:8000/static/uploads/{filename}"}
