const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log('Request URL:', req.url);
  console.log('Current directory:', __dirname);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle root path
  let filePath = req.url === '/' ? 'index.html' : req.url.substring(1);
  
  // Remove query parameters
  filePath = filePath.split('?')[0];
  
  // Build full path
  const fullPath = path.join(__dirname, filePath);
  console.log('Trying to serve file:', fullPath);
  
  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain';

  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log('File not found:', fullPath);
      // List files in directory for debugging
      fs.readdir(__dirname, (err, files) => {
        if (!err) {
          console.log('Available files:', files);
        }
      });
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + filePath);
      return;
    }

    console.log('File found, serving:', fullPath);
    
    // Read and serve the file
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        console.log('Error reading file:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Hindi learning app is ready!');
  
  // List files in current directory for debugging
  fs.readdir(__dirname, (err, files) => {
    if (!err) {
      console.log('Files in current directory:', files);
    }
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});