import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicBaseUrl?: string
}

export interface UploadAssetObjectInput {
    key: string
    body: Buffer | Uint8Array
    contentType?: string
}

export interface SignedAssetUrlInput {
    key: string
    expiresInSeconds?: number
    downloadName?: string
}

let cachedClient: S3Client | null = null
let cachedConfig: R2Config | null = null

function readR2Config(): R2Config {
    const accountId = process.env.R2_ACCOUNT_ID?.trim()
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
    const bucket = process.env.R2_BUCKET?.trim()
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim()

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
        throw new Error("Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.")
    }

    return {
        accountId,
        accessKeyId,
        secretAccessKey,
        bucket,
        publicBaseUrl: publicBaseUrl || undefined,
    }
}

export function getR2Config(): R2Config {
    const nextConfig = readR2Config()
    if (
        cachedConfig &&
        cachedConfig.accountId === nextConfig.accountId &&
        cachedConfig.accessKeyId === nextConfig.accessKeyId &&
        cachedConfig.secretAccessKey === nextConfig.secretAccessKey &&
        cachedConfig.bucket === nextConfig.bucket &&
        cachedConfig.publicBaseUrl === nextConfig.publicBaseUrl
    ) {
        return cachedConfig
    }

    cachedClient = null
    cachedConfig = nextConfig
    return nextConfig
}

function getR2Client(): S3Client {
    if (cachedClient) return cachedClient
    const config = getR2Config()
    cachedClient = new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    })
    return cachedClient
}

export async function uploadAssetObject({
    key,
    body,
    contentType,
}: UploadAssetObjectInput): Promise<void> {
    const config = getR2Config()
    await getR2Client().send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    }))
}

export async function deleteAssetObject(key: string): Promise<void> {
    const config = getR2Config()
    await getR2Client().send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
    }))
}

export async function getSignedAssetReadUrl({
    key,
    expiresInSeconds = 300,
    downloadName,
}: SignedAssetUrlInput): Promise<string> {
    const config = getR2Config()

    return getSignedUrl(
        getR2Client(),
        new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
            ResponseContentDisposition: downloadName
                ? `attachment; filename="${downloadName.replace(/[\r\n"]/g, "_")}"`
                : undefined,
        }),
        { expiresIn: expiresInSeconds },
    )
}

export function getModelContentType(filename: string): string {
    const lower = filename.toLowerCase()
    if (lower.endsWith(".glb")) return "model/gltf-binary"
    if (lower.endsWith(".gltf")) return "model/gltf+json"
    if (lower.endsWith(".fbx")) return "model/vnd.autodesk.fbx"
    if (lower.endsWith(".obj")) return "model/obj"
    if (lower.endsWith(".stl")) return "model/stl"
    if (lower.endsWith(".mtl")) return "text/plain"
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".bin")) return "application/octet-stream"
    if (lower.endsWith(".zip")) return "application/zip"
    return "application/octet-stream"
}
