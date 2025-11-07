import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import appConfig from '../appConfig';

// Minimal response shape we care about from ali-oss
interface PutResult {
  url?: string;
  name?: string;
  res?: any;
}

interface DeleteResult {
  res?: any;
}

// Single options type for client construction and runtime flags
interface OSSOptions {
  accessKeyId?: string;
  accessKeySecret?: string;
  bucket?: string;
  endpoint?: string;
  region?: string;
  authorizationV4?: boolean;
  secure?: boolean;
}

interface OSSClient {
  put(name: string, file: Buffer | string | any): Promise<PutResult>;
  delete?(name: string): Promise<DeleteResult>;
}

let ossClient: OSSClient | null = null;
let ossBucket: string | null = null;
export let useOSS = false;

// Initialize Aliyun OSS client simply and clearly
try {
  const accessKeyId = appConfig.ossAccessKeyId || '';
  const accessKeySecret = appConfig.ossAccessKeySecret || '';
  const region = appConfig.ossRegion || '';
  const endpoint = appConfig.ossEndpoint || '';
  const bucket = appConfig.ossBucket || '';

  if (accessKeyId && accessKeySecret && bucket && endpoint && region) {
    const clientOpts: OSSOptions = {
      accessKeyId,
      accessKeySecret,
      bucket,
      authorizationV4: true,
      region: region,
      endpoint: endpoint,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ossClient = new (OSS as any)(clientOpts) as OSSClient;
    ossBucket = bucket;
    useOSS = true;
    logger.info(`Aliyun OSS client initialized for bucket=${bucket} endpoint=${clientOpts.endpoint || clientOpts.region}`);
  }
} catch (err) {
  logger.warn('Failed to initialize Aliyun OSS client, falling back to local disk storage', err);
}

/**
 * Upload a buffer or local file to OSS. Returns the public url and object key.
 */
export async function uploadToOSS(opts: { buffer?: Buffer; localPath?: string; originalName?: string }) {
  if (!useOSS || !ossClient || !ossBucket) throw new Error('OSS not configured');
  const { buffer, localPath, originalName } = opts;
  const origName = originalName || (localPath ? path.basename(localPath) : 'file.png');
  const ext = path.extname(origName) || '.png';
  const key = `uploads/${uuidv4()}${ext}`;

  const data = buffer ?? (localPath ? fs.createReadStream(localPath) : undefined);
  if (!data) throw new Error('No data to upload');

  const result = await ossClient.put(key, data as any);
  // prefer result.url when available, otherwise construct a canonical public URL
  const url = result.url || `https://${ossBucket}.oss-${appConfig.ossRegion}.aliyuncs.com/${key}`;
  return { url, key };
}

export async function deleteFromOSS(key: string) {
  if (!useOSS || !ossClient) throw new Error('OSS not configured');
  // accept either full URL or object key
  if (key.startsWith('http')) {
    try {
      const u = new URL(key);
      key = u.pathname.replace(/^\//, '');
    } catch (e) {
      // leave as-is
    }
  }
  if (typeof (ossClient as any).delete === 'function') {
    return (ossClient as any).delete(key);
  }
  throw new Error('OSS client does not support delete operation');
}
