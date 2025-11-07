import { Router, RequestHandler } from 'express';
import { createApiResponse } from '../utils/apiUtils';
import { FileUploadResDto } from '@fullstack/common';
import multer from 'multer';
import path from 'path';
import { serverRootDir } from '../utils/path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { useOSS, uploadToOSS, deleteFromOSS } from '../services/aliyunOSS.service';
import logger from '../utils/logger';

const router = Router();

// Aliyun OSS client is initialized in src/services/aliyunOSS and exported as helpers
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
// Keep disk storage to preserve existing behavior; but accept buffer when OSS is used
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: useOSS ? memoryStorage : storage });

// POST /api/file
const uploadHandler: RequestHandler = async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json(createApiResponse<null>(undefined, {
      code: 'NO_FILE',
      message: 'No file uploaded',
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  logger.debug(`Received file upload: originalname=${file.originalname}, size=${file.size} bytes`);
  // If OSS is configured, upload buffer to OSS and return OSS URL
  if (useOSS) {
    try {
      const buffer: Buffer | undefined = (file.buffer as Buffer) ?? undefined;
      const localPath: string | undefined = (file as any).path ?? undefined;
      const result = await uploadToOSS({ buffer, localPath, originalName: file.originalname });
      const dto: FileUploadResDto = { url: result.url };
      res.json(createApiResponse<FileUploadResDto>(dto));
      return;
    } catch (err) {
      logger.error('Failed to upload file to OSS:', err);
      res.status(500).json(createApiResponse<null>(undefined, {
        code: 'OSS_UPLOAD_FAILED',
        message: 'Failed to upload file to OSS',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
  }

  // Fallback: local disk storage
  const fileUrl = `/api/file/${(file as any).filename || file.filename}`;
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

  // If filename looks like a full URL, redirect to it
  if (filename.startsWith('http')) {
    res.redirect(filename);
    return;
  }

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
const deleteFileHandler: RequestHandler = async (req, res) => {
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

  // If OSS is configured, prefer deleting from OSS. The service accepts either a full URL or object key.
  if (useOSS) {
    try {
      // pass the object key (filename) to the OSS delete helper
      logger.debug(`Deleting file from OSS: key=${filename}`);
      await deleteFromOSS(filename);
      res.json(createApiResponse<{ deleted: boolean }>({ deleted: true }));
      return;
    } catch (err) {
      logger.error('Failed to delete file from OSS:', err);
      res.status(500).json(createApiResponse<null>(undefined, {
        code: 'DELETE_FAILED',
        message: 'Failed to delete file from OSS',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
  }

  // Fallback: delete local file
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
// Use wildcard so the param may include slashes (for full URLs)
router.delete('/:filename', deleteFileHandler);

export default router;
