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

export type StoredObject = {
  provider: FileStorageProvider;
  bucket: string;
  objectKey: string;
};

export type ReadObjectResult = {
  body: Readable;
};

@Injectable()
export class FileStorageService {
  private s3Client?: S3Client;

  async putObject(input: {
    objectKey: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredObject> {
    this.assertSafeObjectKey(input.objectKey);
    const config = this.config();
    if (config.provider === 'local') {
      const root = this.localRoot();
      const absolutePath = this.localPath(root, input.objectKey);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, input.body);
      return {
        provider: 'local',
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
      bucket: config.bucket,
      objectKey: input.objectKey,
    };
  }

  async readObject(input: { bucket: string; objectKey: string }) {
    this.assertSafeObjectKey(input.objectKey);
    const config = this.config();
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
    this.config();
    return true;
  }

  storageProvider() {
    return this.config().provider;
  }

  private config() {
    const provider = (process.env.FILE_STORAGE_PROVIDER || 'local')
      .trim()
      .toLowerCase() as FileStorageProvider;
    if (!['local', 's3', 'r2'].includes(provider)) {
      throw new BadRequestException('Unsupported FILE_STORAGE_PROVIDER.');
    }
    const bucket =
      process.env.FILE_STORAGE_BUCKET?.trim() ||
      (provider === 'local' ? 'local-private' : '');
    if (provider !== 'local' && !bucket) {
      throw new BadRequestException('FILE_STORAGE_BUCKET is required.');
    }
    if (provider !== 'local') {
      for (const key of [
        'FILE_STORAGE_REGION',
        'FILE_STORAGE_ACCESS_KEY_ID',
        'FILE_STORAGE_SECRET_ACCESS_KEY',
      ]) {
        if (!process.env[key]?.trim()) {
          throw new BadRequestException(`${key} is required.`);
        }
      }
    }
    return {
      provider,
      bucket,
      region: process.env.FILE_STORAGE_REGION?.trim() || 'auto',
      endpoint: process.env.FILE_STORAGE_ENDPOINT?.trim(),
      accessKeyId: process.env.FILE_STORAGE_ACCESS_KEY_ID?.trim(),
      secretAccessKey: process.env.FILE_STORAGE_SECRET_ACCESS_KEY?.trim(),
    };
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
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: Boolean(config.endpoint),
        credentials: {
          accessKeyId: config.accessKeyId!,
          secretAccessKey: config.secretAccessKey!,
        },
      });
    }
    return this.s3Client;
  }
}
