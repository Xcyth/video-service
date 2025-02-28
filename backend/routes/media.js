const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Video = require('../models/Video');
const User = require('../models/User');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Ensure upload directories exist
const createUploadDirs = async () => {
  const dirs = ['uploads/videos', 'uploads/profiles'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};
createUploadDirs();

// Upload video
router.post('/upload/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const video = new Video({
      title: req.body.title || 'Untitled',
      description: req.body.description || '',
      filename: req.file.filename,
      user: req.user._id,
      size: req.file.size
    });

    await video.save();
    
    // Return complete video object with user details
    const populatedVideo = await Video.findById(video._id)
      .populate('user', 'firstName lastName profilePicture');

    res.status(201).json({
      id: populatedVideo._id,
      title: populatedVideo.title,
      description: populatedVideo.description,
      filename: populatedVideo.filename,
      size: populatedVideo.size,
      createdAt: populatedVideo.createdAt,
      user: {
        id: populatedVideo.user._id,
        firstName: populatedVideo.user.firstName,
        lastName: populatedVideo.user.lastName,
        profilePicture: populatedVideo.user.profilePicture
      },
      videoUrl: `/media/videos/${populatedVideo.filename}`,
      thumbnailUrl: populatedVideo.user.profilePicture 
        ? `/media/profile-pictures/${populatedVideo.user.profilePicture}`
        : null
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Upload profile picture
router.post('/upload/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Delete old profile picture if it exists
    if (req.user.profilePicture) {
      const oldPicturePath = path.join('uploads/profiles', req.user.profilePicture);
      await fs.unlink(oldPicturePath).catch(console.error);
    }

    req.user.profilePicture = req.file.filename;
    await req.user.save();
    res.json({ 
      profilePicture: req.file.filename,
      profilePictureUrl: `/media/profile-pictures/${req.file.filename}`
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all videos with pagination and search
router.get('/videos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const userId = req.query.userId;

    let query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by user if userId is provided
    if (userId) {
      query.user = userId;
    }

    const totalVideos = await Video.countDocuments(query);
    const totalPages = Math.ceil(totalVideos / limit);

    const videos = await Video.find(query)
      .populate('user', 'firstName lastName profilePicture')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    const formattedVideos = videos.map(video => ({
      id: video._id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      size: video.size,
      createdAt: video.createdAt,
      user: {
        id: video.user._id,
        firstName: video.user.firstName,
        lastName: video.user.lastName,
        profilePicture: video.user.profilePicture,
        profilePictureUrl: video.user.profilePicture 
          ? `/media/profile-pictures/${video.user.profilePicture}`
          : null
      },
      videoUrl: `/media/videos/${video.filename}`
    }));

    res.json({
      videos: formattedVideos,
      pagination: {
        currentPage: page,
        totalPages,
        totalVideos,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stream video file
router.get('/videos/:filename', (req, res) => {
  const filePath = path.join('uploads/videos', req.params.filename);
  const stat = fsSync.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fsSync.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fsSync.createReadStream(filePath).pipe(res);
  }
});

// Get profile picture
router.get('/profile-pictures/:filename', (req, res) => {
  const filePath = path.join('uploads/profiles', req.params.filename);
  res.sendFile(filePath, { root: '.' });
});

module.exports = router; 