const multer = require('multer');
const path = require('path');
const BaseMiddleware = require('./BaseMiddleware');

class UploadPerfilMiddleware extends BaseMiddleware {
  static UPLOAD_DIR = path.join(__dirname, '../../uploads/perfil');
  static FIELD_PREFIX = 'perfil';
  static IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
  
  static generateProfileFilename(originalName, userId) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(originalName);
    
    return `${UploadPerfilMiddleware.FIELD_PREFIX}_${userId}_${timestamp}_${random}${extension}`;
  }
}

BaseMiddleware.ensureDirectoryExists(UploadPerfilMiddleware.UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UploadPerfilMiddleware.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    try {
      const userId = req.params.id;
      const filename = UploadPerfilMiddleware.generateProfileFilename(file.originalname, userId);
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

const fileFilter = (_req, file, cb) => {
  try {
    const isValid = BaseMiddleware.validateImageFile(file);
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF)'));
    }
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: UploadPerfilMiddleware.IMAGE_SIZE_LIMIT
  },
  fileFilter
});

module.exports = {
  upload,
  UploadPerfilMiddleware
};