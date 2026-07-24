const aws = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadToS3 = async (file, folder = 'uploads') => {
  if (!file) {
    throw new Error('No file provided');
  }

  const resizedBuffer = await sharp(file.buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const fileExt = '.jpg';
  const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: resizedBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = {
  upload,
  uploadToS3,
};
