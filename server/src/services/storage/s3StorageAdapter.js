/**
 * AWS S3 & Cloudflare R2 Storage Adapter
 * Manages private object storage for production-grade APK distribution.
 * Uses lazy dynamic loading so the application boots instantly without hard AWS SDK runtime dependencies.
 */
export class S3StorageAdapter {
  constructor(options = {}) {
    this.region = options.region || process.env.AWS_REGION || 'us-east-1';
    this.bucket = options.bucket || process.env.AWS_S3_BUCKET;
    this.provider = options.provider || 's3';
    this.endpoint = options.endpoint || process.env.AWS_S3_ENDPOINT;
    this.s3Client = null;
  }

  async _getClient() {
    if (!this.s3Client) {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const clientConfig = {
        region: this.region,
      };

      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        clientConfig.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }

      if (this.endpoint) {
        clientConfig.endpoint = this.endpoint;
      }

      this.s3Client = new S3Client(clientConfig);
    }
    return this.s3Client;
  }

  /**
   * Upload APK binary directly to private S3 bucket
   */
  async uploadApk({ key, buffer, stream, contentType }) {
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    const s3 = await this._getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer || stream,
      ContentType: contentType || 'application/vnd.android.package-archive',
      ServerSideEncryption: 'AES256',
    });

    await s3.send(command);

    return {
      key,
      storageProvider: this.provider,
      storagePath: `s3://${this.bucket}/${key}`,
      contentType: contentType || 'application/vnd.android.package-archive',
    };
  }

  /**
   * Read APK file buffer from S3
   */
  async getApkBuffer({ key }) {
    const stream = await this.getApkStream({ key });
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Get readable stream from S3
   */
  async getApkStream({ key }) {
    const s3 = await this._getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await s3.send(command);
    return response.Body;
  }

  /**
   * Delete APK object from S3
   */
  async deleteApk({ key }) {
    try {
      const s3 = await this._getClient();
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await s3.send(command);
      return { success: true, key };
    } catch (err) {
      console.error(`[S3Storage] Failed to delete key: ${key}`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates AWS S3 presigned GetObject URL with Content-Disposition attachment
   */
  async generateDownloadUrl({ key, expiresIn = 900, filename = 'app.apk' }) {
    const s3 = await this._getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const sanitizedFilename = encodeURIComponent(filename);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${sanitizedFilename}"`,
    });

    return await getSignedUrl(s3, command, { expiresIn });
  }

  /**
   * Generates AWS S3 presigned PutObject URL for direct client-to-storage upload
   */
  async generateUploadUrl({ key, expiresIn = 900, contentType = 'application/vnd.android.package-archive' }) {
    const s3 = await this._getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    return await getSignedUrl(s3, command, { expiresIn });
  }
}

export default S3StorageAdapter;
