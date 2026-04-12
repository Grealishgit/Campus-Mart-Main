const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET_KEY;

const missingCloudinaryEnv = [];
if (!cloudName) missingCloudinaryEnv.push('CLOUDINARY_CLOUD_NAME');
if (!apiKey) missingCloudinaryEnv.push('CLOUDINARY_API_KEY');
if (!apiSecret) missingCloudinaryEnv.push('CLOUDINARY_API_SECRET');

if (missingCloudinaryEnv.length > 0) {
  throw new Error(`Missing Cloudinary env vars: ${missingCloudinaryEnv.join(', ')}`);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = file.fieldname === 'avatar' ? 'campus-mart/avatars' : 'campus-mart/listings';
    return {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// File filter - image mime types only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isValid = allowedMimeTypes.includes(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
