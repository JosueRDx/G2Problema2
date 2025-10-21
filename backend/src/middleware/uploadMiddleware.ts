// /backend/src/middleware/uploadMiddleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express'; // Import Request type

// Directorio de subidas (relativo a la raíz del proyecto backend)
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Asegurarse de que el directorio exista
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Directorio de subidas creado en: ${UPLOADS_DIR}`);
} else {
    console.log(`Directorio de subidas ya existe: ${UPLOADS_DIR}`);
}


// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // Guarda en la carpeta 'uploads'
  },
  filename: (req, file, cb) => {
    // Nombre de archivo único: timestamp-nombreoriginal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension); // Guarda solo con sufijo único y extensión
    // cb(null, uniqueSuffix + '-' + file.originalname); // Opción: Guardar con nombre original incluido
  }
});

// Filtro de archivos (opcional pero recomendado)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Permitir imágenes, PDF, documentos Word
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    // Rechazar archivo
    cb(new Error('Tipo de archivo no permitido. Solo imágenes (jpg, png, gif), PDF o documentos Word (doc, docx).'));
};

// Crear la instancia de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10MB (ajusta si es necesario)
    },
    fileFilter: fileFilter
});

export default upload;