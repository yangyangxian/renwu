import { Router, RequestHandler } from 'express';
import { createApiResponse } from '../utils/apiUtils';
import { FileUploadResDto } from '@fullstack/common';
import multer from 'multer';
import path from 'path';
import { serverRootDir } from '../utils/path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.resolve(serverRootDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, uuidv4() + ext);
  },
});
const upload = multer({ storage });

// POST /api/file
const uploadHandler: RequestHandler = (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json(createApiResponse<null>(undefined, {
      code: 'NO_FILE',
      message: 'No file uploaded',
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  // Return an authenticated URL endpoint to retrieve the file
  const fileUrl = `/api/file/${file.filename}`;
  const dto: FileUploadResDto = { url: fileUrl };
  res.json(createApiResponse<FileUploadResDto>(dto));
};
router.post('/', upload.single('file'), uploadHandler);

// GET /api/file/:filename - stream file (authenticated)
const getFileHandler: RequestHandler = (req, res) => {
  const raw = req.params.filename || '';
  const filename = path.basename(raw); // prevent path traversal
  if (!filename) {
    res.status(400).json(createApiResponse<null>(undefined, {
      code: 'NO_FILENAME',
      message: 'No filename provided',
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  const filePath = path.join(uploadDir, filename);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.status(404).json(createApiResponse<null>(undefined, {
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.avif': 'image/avif',
    };
    const contentType = mimeMap[ext] ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.sendStatus(500);
    });
    stream.pipe(res);
  });
};
router.get('/:filename', getFileHandler);

// DELETE /api/file/:filename - delete an uploaded file
const deleteFileHandler: RequestHandler = (req, res) => {
  const raw = req.params.filename || '';
  const filename = path.basename(raw);
  if (!filename) {
    res.status(400).json(createApiResponse<null>(undefined, {
      code: 'NO_FILENAME',
      message: 'No filename provided',
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  const filePath = path.join(uploadDir, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      res.status(500).json(createApiResponse<null>(undefined, {
        code: 'DELETE_FAILED',
        message: 'Failed to delete file',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
    res.json(createApiResponse<{ deleted: boolean }>({ deleted: true }));
  });
};
router.delete('/:filename', deleteFileHandler);

export default router;
