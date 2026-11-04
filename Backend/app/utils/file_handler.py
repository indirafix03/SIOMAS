import os
import uuid
from werkzeug.utils import secure_filename
from app.config import Config

def allowed_file(filename: str) -> bool:
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS


def save_uploaded_file(file_storage, category: str = 'documents') -> str:
    """
    Saves an uploaded file to the category folder inside UPLOAD_FOLDER.
    Returns the relative path from UPLOAD_FOLDER (e.g. 'lpj/20261015_uuid_file.pdf')
    or absolute path if preferred.
    """
    category_folder = os.path.join(Config.UPLOAD_FOLDER, category.lower())
    os.makedirs(category_folder, exist_ok=True)

    original_name = secure_filename(file_storage.filename)
    if not original_name:
        original_name = "file"

    unique_prefix = uuid.uuid4().hex[:10]
    final_filename = f"{unique_prefix}_{original_name}"
    full_path = os.path.join(category_folder, final_filename)
    file_storage.save(full_path)

    # Relative path stored in database: e.g. "lpj/abc123_document.pdf"
    relative_path = os.path.join(category.lower(), final_filename).replace('\\', '/')
    return relative_path


def get_absolute_file_path(relative_path: str) -> str:
    """
    Converts a stored relative path to full absolute path.
    """
    return os.path.join(Config.UPLOAD_FOLDER, relative_path)
