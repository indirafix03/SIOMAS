const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// Ensure uploads directory exists (shared with Backend/uploads)
const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_FOLDER || '../Backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Configuration (Max 10 MB, PDF/DOC/DOCX/JPG/PNG/ZIP)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = crypto.randomBytes(16).toString('hex');
    cb(null, `${uid}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  UPLOAD_DIR,
  upload
};

