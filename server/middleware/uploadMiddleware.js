// server/middleware/uploadMiddleware.js

const multer = require("multer");
const path = require("path");

// NOTE: In production you would typically store in S3/Cloudinary/etc.
// Here we store locally and validate file type/size.

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedDocumentTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const makeStorage = (folderName) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../../uploads", folderName));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${ext}`);
    },
  });
};

const imageUpload = multer({
  storage: makeStorage("images"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid image file type"));
    }
    return cb(null, true);
  },
});

const documentUpload = multer({
  storage: makeStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!allowedDocumentTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid document file type"));
    }
    return cb(null, true);
  },
});

// Upload helpers
const uploadImage = imageUpload.single("file");
const uploadDocument = documentUpload.single("file");

module.exports = {
  uploadImage,
  uploadDocument,
};

