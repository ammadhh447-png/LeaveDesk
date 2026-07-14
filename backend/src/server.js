import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { verifyCloudinary } from './config/cloudinary.js';
import { startNotificationScheduler } from './services/notification.scheduler.js';
import { getStorageProvider } from './services/storage.service.js';

const startServer = async () => {
  await connectDB();
  startNotificationScheduler();

  const storageProvider = getStorageProvider();
  if (storageProvider === 'cloudinary') {
    const cloudinaryCheck = await verifyCloudinary();
    if (cloudinaryCheck.ok) {
      console.log(`Cloudinary ready (${cloudinaryCheck.cloudName}, ${cloudinaryCheck.mode} uploads)`);
    } else {
      console.warn(`Cloudinary: ${cloudinaryCheck.message || cloudinaryCheck.reason}`);
    }
  }

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`File storage: ${storageProvider}`);
    if (storageProvider === 'local') {
      console.log('Uploads served from backend/uploads/ (free, no cloud account needed)');
    }
  });
};

startServer();
