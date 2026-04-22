const https = require('https');
https.get('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Safety_boots.jpg/800px-Safety_boots.jpg', (res) => {
    console.log(res.statusCode);
});
