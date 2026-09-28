import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const uploadRoot = path.resolve(process.cwd(), config.upload.dir);

let s3Client: S3Client | null = null;
const getS3Client = (): S3Client => {
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: config.storage.s3.region,
    endpoint: config.storage.s3.endpoint,
    forcePathStyle: config.storage.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.storage.s3.accessKeyId!,
      secretAccessKey: config.storage.s3.secretAccessKey!,
    },
  });
  return s3Client;
};

const buildObjectKey = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

const s3PublicUrl = (key: string): string => {
  if (config.storage.s3.publicBaseUrl) {
    return `${config.storage.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
  if (config.storage.s3.endpoint) {
    // Path-style URL against a custom endpoint (R2, MinIO, Supabase Storage's S3 endpoint, ...).
    return `${config.storage.s3.endpoint.replace(/\/$/, '')}/${config.storage.s3.bucket}/${key}`;
  }
  return `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
};

/**
 * Persists an uploaded file's bytes and returns the URL it can be fetched
 * from. Behind STORAGE_DRIVER: 'local' keeps today's behaviour (written under
 * UPLOAD_DIR, served by the /uploads static route); 's3' uploads to any
 * S3-compatible bucket so files survive redeploys on ephemeral hosting.
 */
export const saveUploadedFile = async (file: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<{ url: string; key: string }> => {
  const key = buildObjectKey(file.originalname);

  if (config.storage.driver === 's3') {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: config.storage.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return { url: s3PublicUrl(key), key };
  }

  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
  await fs.promises.writeFile(path.join(uploadRoot, key), file.buffer);
  return { url: `${config.appBaseUrl}/uploads/${key}`, key };
};
