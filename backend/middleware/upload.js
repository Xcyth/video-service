const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, 'uploads/videos');
    } else if (file.fieldname === 'profilePicture') {
      cb(null, 'uploads/profiles');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Allow only mp4 files for videos
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 videos are allowed!'), false);
    }
  } else if (file.fieldname === 'profilePicture') {
    // Allow only image files for profile pictures
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else {
    cb(new Error('Invalid field name!'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: file => {
      if (file.fieldname === 'video') {
        return 6 * 1024 * 1024; // 6MB for videos
      }
      return 2 * 1024 * 1024; // 2MB for profile pictures
    }
  }
});

module.exports = upload; 