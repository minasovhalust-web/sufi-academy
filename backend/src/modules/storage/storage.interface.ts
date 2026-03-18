/**
 * STORAGE_SERVICE — injection token for the StorageService interface.
 *
 * Use @Inject(STORAGE_SERVICE) in any class that needs file storage.
 * This decouples consumers from the concrete provider (S3, MinIO, GCS, etc.).
 */
export const STORAGE_SERVICE = 'STORAGE_SERVICE';

// ── Result types ───────────────────────────────────────────

export interface UploadResult {
  /** The S3 object key — used as a stable reference in the database. */
  key: string;
  /** A signed URL for immediate access to the uploaded object. */
  url: string;
}

export interface PresignedUploadResult {
  /**
   * Client sends a PUT request directly to this URL.
   * The file never passes through the application server.
   */
  uploadUrl: string;
  /** The S3 object key that will be created after the upload. */
  key: string;
  /** TTL in seconds after which the upload URL expires. */
  expiresIn: number;
}

// ── Service interface ──────────────────────────────────────

export interface StorageService {
  /**
   * Upload a buffer directly from the server to storage.
   * Use this for small server-generated files.
   * For large uploads (video), prefer getSignedUploadUrl instead.
   */
  upload(buffer: Buffer, key: string, mimeType: string): Promise<UploadResult>;

  /**
   * Generate a pre-signed URL for reading / streaming an object.
   *
   * @param key - S3 object key
   * @param ttlSeconds - URL lifetime in seconds (default: 300 = 5 min)
   */
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;

  /**
   * Generate a pre-signed PUT URL so the client uploads directly to S3.
   * The server only generates the URL — no file data flows through it.
   *
   * @param key - Desired S3 object key
   * @param mimeType - Content-Type the client must set on the PUT request
   * @param ttlSeconds - URL lifetime in seconds (default: 3600 = 1 h)
   */
  getSignedUploadUrl(
    key: string,
    mimeType: string,
    ttlSeconds?: number,
  ): Promise<PresignedUploadResult>;

  /**
   * Permanently delete an object from storage.
   * Called when a video or material record is deleted.
   */
  delete(key: string): Promise<void>;
}
