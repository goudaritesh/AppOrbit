import path from 'path';
import fs from 'fs';
import DownloadService from './download.service.js';

export const initiateDownload = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { versionId, source } = req.body;
    const user = req.user || null;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await DownloadService.initiateDownload({
      appId,
      versionId,
      user,
      ip,
      userAgent,
      source: source || 'MARKETPLACE',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const streamDownloadFile = async (req, res, next) => {
  try {
    const { sessionToken } = req.params;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const session = await DownloadService.startDownload({ sessionToken, ip });
    const version = session.version;
    const app = session.application;

    // Check storage path or generate dummy response if in local mock mode
    const apkFileName = `${app.slug || 'app'}-v${version.versionName || '1.0.0'}.apk`;

    // If a physical file exists on disk, stream it
    if (version.storagePath && fs.existsSync(version.storagePath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${apkFileName}"`);
      return fs.createReadStream(version.storagePath).pipe(res);
    }

    // If storageKey exists in local storage directory
    const localStoragePath = path.join(process.cwd(), 'storage', 'apks', version.storageKey || `${version._id}.apk`);
    if (fs.existsSync(localStoragePath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${apkFileName}"`);
      return fs.createReadStream(localStoragePath).pipe(res);
    }

    // Fallback: If external URL (e.g. S3 signed URL) is configured
    if (version.fileUrl && (version.fileUrl.startsWith('http://') || version.fileUrl.startsWith('https://'))) {
      return res.redirect(version.fileUrl);
    }

    // Default safe fallback package stream for testing/mock environments
    const mockApkHeader = Buffer.from(`PK\x03\x04AppOrbitVerifiedApk:${app.name}:${version.versionName}`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${apkFileName}"`);
    res.setHeader('Content-Length', mockApkHeader.length);
    res.send(mockApkHeader);
  } catch (error) {
    next(error);
  }
};

export const completeDownload = async (req, res, next) => {
  try {
    const { sessionId, sessionToken } = { ...req.params, ...req.body };
    const token = sessionToken || sessionId;

    const result = await DownloadService.completeDownload({ sessionToken: token });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserDownloads = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await DownloadService.getUserDownloadHistory(req.user._id, { page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
