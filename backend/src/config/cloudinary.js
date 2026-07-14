import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

let configured = false;

export const isCloudinaryEnabled = () => Boolean(
  env.cloudinaryCloudName
  && env.cloudinaryApiKey
  && env.cloudinaryApiSecret,
);

export const getCloudinary = () => {
  if (!isCloudinaryEnabled()) return null;

  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
};

export const verifyCloudinary = async () => {
  if (!isCloudinaryEnabled()) {
    return {
      ok: false,
      reason: 'missing_env',
      message: 'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.',
    };
  }

  try {
    await getCloudinary().api.ping();
  } catch (error) {
    return {
      ok: false,
      reason: 'auth_failed',
      message: 'Invalid Cloudinary API credentials. Copy the API Key and Secret from Cloudinary → Settings → API Keys (use the Root key).',
    };
  }

  try {
    const client = getCloudinary();
    const probe = await client.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      {
        folder: 'leavedesk/system',
        resource_type: 'image',
        public_id: `probe-${Date.now()}`,
      },
    );

    await client.uploader.destroy(probe.public_id, { resource_type: 'image' });

    return {
      ok: true,
      cloudName: env.cloudinaryCloudName,
      mode: 'signed',
    };
  } catch (error) {
    const detail = error?.error?.message || error?.message || 'Cloudinary upload test failed.';

    if (error?.http_code === 403) {
      return {
        ok: false,
        reason: 'upload_forbidden',
        message: 'Upload blocked (403). In Cloudinary → Settings → API Keys, use the Root API key OR assign your key the Master Admin role (new keys have no upload permission by default).',
      };
    }

    return { ok: false, reason: 'upload_failed', message: detail };
  }
};
