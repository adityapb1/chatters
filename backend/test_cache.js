const http = require('http');
http.get('http://localhost:5005/api/conversations', res => {
  console.log('Headers:', res.headers);
});
