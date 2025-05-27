const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BaseMiddleware = require('./BaseMiddleware');
require('dotenv').config();

class UploadMiddleware extends BaseMiddleware {
  static FIELD_MAPPINGS = {
    'foto_laudo_medico': 'laudos',
    'foto_cabelo': 'cabelos',
    'foto_peruca': 'perucas',
    'foto_anexo': 'anexos'
  };

  static getTargetDirectory(fieldname) {
    const subDir = UploadMiddleware.FIELD_MAPPINGS[fieldname];
    return subDir 
      ? path.join(BaseMiddleware.UPLOAD_DIR, subDir)
      : BaseMiddleware.UPLOAD_DIR;
  }

  static async createDirectoryIfNotExists(dirPath) {
    await BaseMiddleware.ensureDirectoryExists(dirPath);
  }
}

UploadMiddleware.ensureDirectoryExists(BaseMiddleware.UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: async (_req, file, cb) => {
    try {
      const targetDir = UploadMiddleware.getTargetDirectory(file.fieldname);
      await UploadMiddleware.createDirectoryIfNotExists(targetDir);
      cb(null, targetDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    try {
      const filename = BaseMiddleware.generateUniqueFilename(
        file.originalname,
        file.fieldname
      );
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

const fileFilter = (_req, file, cb) => {
  try {
    const isValid = BaseMiddleware.validateFileType(file);
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Apenas JPEG, PNG, GIF e PDF são permitidos.'), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: BaseMiddleware.MAX_FILE_SIZE
  }
});

const fileToByteaBuffer = (filePath) => {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    BaseMiddleware.logError('fileToByteaBuffer', error);
    throw new Error(`Erro ao ler arquivo: ${filePath}`);
  }
};

module.exports = {
  upload,
  fileToByteaBuffer,
  UploadMiddleware
};