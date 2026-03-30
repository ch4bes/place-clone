const express = require('express');
const router = express.Router();
const { getCanvas } = require('../services/firebase');

/**
 * GET /api/canvas
 * Returns full canvas state
 */
router.get('/', async (req, res) => {
  try {
    const canvas = await getCanvas();
    
    // Convert to array format for easier client-side processing
    const pixels = Object.values(canvas);
    
    res.json({
      success: true,
      pixels,
      count: pixels.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching canvas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch canvas',
    });
  }
});

/**
 * GET /api/canvas/bitmap
 * Returns compressed bitmap representation
 */
router.get('/bitmap', async (req, res) => {
  try {
    const canvas = await getCanvas();
    
    // Create 256x256 bitmap (65536 pixels, 4 bits each = 32KB)
    const bitmap = new Uint8Array(32768); // 256 * 256 / 2
    
    // Fill with default color (white = 0)
    bitmap.fill(0);
    
    // Set placed pixels
    Object.values(canvas).forEach(pixel => {
      const offset = pixel.y * 256 + pixel.x;
      const byteIndex = Math.floor(offset / 2);
      const isEven = offset % 2 === 0;
      
      if (isEven) {
        bitmap[byteIndex] = (pixel.color << 4) | (bitmap[byteIndex] & 0x0F);
      } else {
        bitmap[byteIndex] = bitmap[byteIndex] | pixel.color;
      }
    });
    
    // Convert to base64 for transmission
    const base64 = Buffer.from(bitmap).toString('base64');
    
    res.json({
      success: true,
      bitmap: base64,
      width: 256,
      height: 256,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching bitmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bitmap',
    });
  }
});

module.exports = router;
