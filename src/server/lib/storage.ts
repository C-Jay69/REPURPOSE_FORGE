import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync, statSync } from 'fs';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = process.env.STORAGE_ROOT || resolve(__dirname, '..', '..', 'storage');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

export interface StorageProvider {
  save(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = STORAGE_ROOT) {
    this.root = root;
    if (!existsSync(this.root)) {
      mkdirSync(this.root, { recursive: true });
    }
  }

  private getPath(key: string): string {
    const safeKey = key.replace(/\.\./g, '').replace(/^\//, '');
    return join(this.root, safeKey);
  }

  async save(key: string, data: Buffer | Uint8Array, _contentType?: string): Promise<string> {
    const filePath = this.getPath(key);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, data);
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    const filePath = this.getPath(key);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getPath(key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    return `${PUBLIC_BASE_URL}/api/files/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.getPath(key));
  }

  getLocalPath(key: string): string {
    return this.getPath(key);
  }

  getFileSize(key: string): number | null {
    const filePath = this.getPath(key);
    if (!existsSync(filePath)) return null;
    return statSync(filePath).size;
  }
}

export class S3StorageProvider implements StorageProvider {
  private client: any;
  private bucket: string;
  private region: string;

  constructor() {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    this.bucket = process.env.S3_BUCKET!;
    this.region = process.env.S3_REGION || 'us-east-1';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    });
  }

  async save(key: string, data: Buffer | Uint8Array, contentType?: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.get(key);
      return true;
    } catch {
      return false;
    }
  }
}

function createProvider(): StorageProvider {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storage = createProvider();

export function generateStorageKey(userId: string, type: 'videos' | 'clips' | 'exports' | 'thumbnails' | 'branding', filename: string): string {
  const ext = filename.split('.').pop() || '';
  const uuid = randomUUID();
  return `${type}/${userId}/${uuid}.${ext}`;
}

export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    let output = '';
    ffprobe.stdout.on('data', (data: Buffer) => { output += data.toString(); });
    ffprobe.on('close', (code: number) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()) || 0);
      } else {
        reject(new Error('ffprobe failed'));
      }
    });
    ffprobe.on('error', reject);
  });
}