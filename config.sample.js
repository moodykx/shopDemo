import path from 'path';

module.exports = {
  mongod:     'mongodb://localhost/tweet',
  uploadPath: path.join(__dirname, 'public', 'upload'),
  tempPath:   path.join(__dirname, 'public', 'temp'),
  processPath: 'upload',
  dev: true,
  redis: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    prefix: 'baoniu:'
  },
  alidayu: {
    appkey: '23749858' ,
    appsecret: '533779758c7856e452bba9b5602febe4' ,
    REST_URL: 'http://gw.api.taobao.com/router/rest'
  },
};