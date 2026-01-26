const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Optimize image - resize and compress
 */
const optimizeImage = async (filePath, options = {}) => {
  const {
    width = 1920,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    const buffer = await sharp(filePath)
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      [format]({ quality })
      .toBuffer();

    await fs.writeFile(filePath, buffer);
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate thumbnail
 */
const generateThumbnail = async (filePath, thumbnailPath, size = 300) => {
  try {
    await sharp(filePath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    return {
      success: true,
      path: thumbnailPath
    };
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get image metadata
 */
const getImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      success: true,
      data: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  optimizeImage,
  generateThumbnail,
  getImageMetadata
};
