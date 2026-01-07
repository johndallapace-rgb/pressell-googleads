const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, '../public/images/placeholders');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const file = fs.createWriteStream(path.join(dir, 'health-default.jpg'));
const request = https.get("https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1000&auto=format&fit=crop", function(response) {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed: health-default.jpg');
  });
});
