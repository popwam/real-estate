import { BadRequestException, Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join, normalize, relative, resolve } from 'path';
import type { Readable } from 'stream';

export type FileStorageProvider = 'local' | 's3' | 'r2';
export type FilePurpose =
  | 'PUBLIC_MEDIA'
  | 'PROJECT_MEDIA'
  | 'COMPANY_DOCUMENT'
  | 'CHAT_ATTACHMENT'
  | 'HR_DOCUMENT'
  | 'ATTENDANCE_EVIDENCE'
  | 'QUARANTINE';

export type StoredObject = {
  provider: FileStorageProvider;
  purpose: FilePurpose;
  bucket: string;
  objectKey: string;
};

export type ReadObjectResult = {
  body: Readable;
};

@Injectable()
export class FileStorageService {
  private readonly clients = new Map<string, S3Client>();

  async putObject(input: {
    purpose?: FilePurpose;
    objectKey: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredObject> {
    this.assertSafeObjectKey(input.objectKey);
    const purpose = this.normalizePurpose(input.purpose);
    const config = this.config(purpose);
    if (config.provider === 'local') {
      const root = this.localRoot();
      const absolutePath = this.localPath(root, input.objectKey);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, input.body);
      return {
        provider: 'local',
        purpose,
        bucket: config.bucket,
        objectKey: input.objectKey,
      };
    }

    const client = this.objectStorageClient(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.mimeType,
        ACL: undefined,
      }),
    );
    return {
      provider: config.provider,
      purpose,
      bucket: config.bucket,
      objectKey: input.objectKey,
    };
  }

  async readObject(input: { bucket: string; objectKey: string; purpose?: FilePurpose }) {
    this.assertSafeObjectKey(input.objectKey);
    const purpose = this.normalizePurpose(input.purpose);
    const config = this.config(purpose, input.bucket);
    if (config.provider === 'local') {
      const root = this.localRoot();
      return { body: createReadStream(this.localPath(root, input.objectKey)) };
    }

    const response = await this.objectStorageClient(config).send(
      new GetObjectCommand({
        Bucket: input.bucket || config.bucket,
        Key: input.objectKey,
      }),
    );
    if (!response.Body) {
      throw new BadRequestException('Stored file body is unavailable.');
    }
    return { body: response.Body as Readable };
  }

  validateConfiguration() {
    for (const purpose of FILE_PURPOSES) {
      this.config(purpose);
    }
    return true;
  }

  storageProvider() {
    return this.config('QUARANTINE').provider;
  }

  private config(purpose: FilePurpose, bucketOverride?: string) {
    const provider = this.provider();
    if (provider === 'local') {
      return {
        provider,
        bucket: bucketOverride?.trim() || 'local-private',
        region: 'local',
        endpoint: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
      };
    }

    const bucketConfig = BUCKET_ENV_BY_PURPOSE[purpose];
    const bucket = bucketOverride?.trim() || process.env[bucketConfig.bucket]?.trim();
    if (!bucket) {
      throw new BadRequestException(
        `${bucketConfig.bucket} is required for ${purpose} uploads.`,
      );
    }
    const endpoint =
      process.env.R2_ENDPOINT?.trim() ||
      process.env.FILE_STORAGE_ENDPOINT?.trim();
    const region =
      process.env.R2_REGION?.trim() ||
      process.env.FILE_STORAGE_REGION?.trim() ||
      'auto';
    const accessKeyId = process.env[bucketConfig.accessKeyId]?.trim();
    const secretAccessKey = process.env[bucketConfig.secretAccessKey]?.trim();
    const missing = [
      endpoint ? undefined : 'R2_ENDPOINT',
      region ? undefined : 'R2_REGION',
      accessKeyId ? undefined : bucketConfig.accessKeyId,
      secretAccessKey ? undefined : bucketConfig.secretAccessKey,
    ].filter(Boolean);
    if (missing.length) {
      throw new BadRequestException(
        `Missing R2 configuration for ${purpose}: ${missing.join(', ')}.`,
      );
    }

    return {
      provider,
      bucket,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    };
  }

  private provider() {
    const configured = (process.env.FILE_STORAGE_PROVIDER || 'local')
      .trim()
      .toLowerCase() as FileStorageProvider;
    if (!['local', 's3', 'r2'].includes(configured)) {
      throw new BadRequestException('Unsupported FILE_STORAGE_PROVIDER.');
    }
    return configured;
  }

  private localRoot() {
    return resolve(
      process.env.FILE_STORAGE_LOCAL_ROOT || join(process.cwd(), 'storage'),
    );
  }

  private localPath(root: string, objectKey: string) {
    const target = resolve(root, normalize(objectKey));
    const relativePath = relative(root, target);
    if (
      relativePath.startsWith('..') ||
      relativePath === '..' ||
      relativePath.startsWith('/') ||
      relativePath.startsWith('\\')
    ) {
      throw new BadRequestException('Unsafe file object key.');
    }
    return target;
  }

  private assertSafeObjectKey(objectKey: string) {
    if (
      !objectKey ||
      objectKey.startsWith('/') ||
      objectKey.startsWith('\\') ||
      objectKey.includes('..') ||
      objectKey.includes('\\')
    ) {
      throw new BadRequestException('Unsafe file object key.');
    }
  }

  private objectStorageClient(
    config: ReturnType<FileStorageService['config']>,
  ) {
    const key = [
      config.endpoint,
      config.region,
      config.accessKeyId,
      config.bucket,
    ].join('|');
    let client = this.clients.get(key);
    if (!client) {
      client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: Boolean(config.endpoint),
        credentials: {
          accessKeyId: config.accessKeyId!,
          secretAccessKey: config.secretAccessKey!,
        },
      });
      this.clients.set(key, client);
    }
    return client;
  }

  private normalizePurpose(purpose: FilePurpose | undefined): FilePurpose {
    return purpose && FILE_PURPOSES.includes(purpose) ? purpose : 'QUARANTINE';
  }
}

const FILE_PURPOSES = [
  'PUBLIC_MEDIA',
  'PROJECT_MEDIA',
  'COMPANY_DOCUMENT',
  'CHAT_ATTACHMENT',
  'HR_DOCUMENT',
  'ATTENDANCE_EVIDENCE',
  'QUARANTINE',
] as const satisfies readonly FilePurpose[];

const BUCKET_ENV_BY_PURPOSE: Record<
  FilePurpose,
  { bucket: string; accessKeyId: string; secretAccessKey: string }
> = {
  PUBLIC_MEDIA: {
    bucket: 'R2_PUBLIC_MEDIA_BUCKET',
    accessKeyId: 'R2_PUBLIC_MEDIA_ACCESS_KEY_ID',
    secretAccessKey: 'R2_PUBLIC_MEDIA_SECRET_ACCESS_KEY',
  },
  PROJECT_MEDIA: {
    bucket: 'R2_PROJECT_MEDIA_BUCKET',
    accessKeyId: 'R2_PROJECT_MEDIA_ACCESS_KEY_ID',
    secretAccessKey: 'R2_PROJECT_MEDIA_SECRET_ACCESS_KEY',
  },
  COMPANY_DOCUMENT: {
    bucket: 'R2_COMPANY_DOCUMENTS_BUCKET',
    accessKeyId: 'R2_COMPANY_DOCUMENTS_ACCESS_KEY_ID',
    secretAccessKey: 'R2_COMPANY_DOCUMENTS_SECRET_ACCESS_KEY',
  },
  CHAT_ATTACHMENT: {
    bucket: 'R2_CHAT_ATTACHMENTS_BUCKET',
    accessKeyId: 'R2_CHAT_ATTACHMENTS_ACCESS_KEY_ID',
    secretAccessKey: 'R2_CHAT_ATTACHMENTS_SECRET_ACCESS_KEY',
  },
  HR_DOCUMENT: {
    bucket: 'R2_HR_DOCUMENTS_BUCKET',
    accessKeyId: 'R2_HR_DOCUMENTS_ACCESS_KEY_ID',
    secretAccessKey: 'R2_HR_DOCUMENTS_SECRET_ACCESS_KEY',
  },
  ATTENDANCE_EVIDENCE: {
    bucket: 'R2_ATTENDANCE_EVIDENCE_BUCKET',
    accessKeyId: 'R2_ATTENDANCE_EVIDENCE_ACCESS_KEY_ID',
    secretAccessKey: 'R2_ATTENDANCE_EVIDENCE_SECRET_ACCESS_KEY',
  },
  QUARANTINE: {
    bucket: 'R2_QUARANTINE_UPLOADS_BUCKET',
    accessKeyId: 'R2_QUARANTINE_UPLOADS_ACCESS_KEY_ID',
    secretAccessKey: 'R2_QUARANTINE_UPLOADS_SECRET_ACCESS_KEY',
  },
};
