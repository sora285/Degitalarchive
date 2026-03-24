import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
  imageLibraryBaseUrl:
    process.env.IMAGE_LIBRARY_BASE_URL ||
    'https://digital-archive-images.s3.ap-northeast-1.amazonaws.com/images/student_images',
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    socketPath: process.env.DB_SOCKET_PATH || '',
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    name: required('DB_NAME'),
  },
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  s3: {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    bucket: process.env.AWS_S3_BUCKET || 'digital-archive-images',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    articleImagePrefix: process.env.AWS_S3_ARTICLE_IMAGE_PREFIX || 'images/article_images',
  },
};
