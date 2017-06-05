import { File } from './models';
import { FuncService } from './service';
import { uploadPath, tempPath, func, processPath, dev } from '../../config';
import fs from 'fs-extra';
import { stat } from 'fs';
import formidable from 'formidable';
export const srv = new FuncService(func);

export async function upload(file, bucket='images', ext='.jpg') {
  let fileObj;
  try {
    fileObj = await doUpload(file, bucket, ext);
  } catch (e) {
    console.error(e);
  }
  await fs.remove(file.path)
  if (fileObj) {
    return fileObj.toJSON();
  } else {
    throw "Upload failed."
  }
}

async function doUpload(file, bucket='images', ext='.jpg') {
  let fileObj;
  fileObj = await File.findOne({file_key: file.hash});
  if (fileObj) {
    return fileObj;
  }
  const fileName = uploadPath + '/' + file.hash + ext;
  await fs.move(file.path, fileName, {overwrite: true});
  await waitUpload(fileName);
  fileObj = await (new File({file_key: file.hash, file_bucket: bucket, extra: { ext }})).save();
  if (!dev) {
    await srv.run({ func: 'process-image', raw: processPath + '/' + file.hash + ext })
  }
  return fileObj;
}

export function waitUpload(fileName, counter = 0) {
  return new Promise((resolve, reject) => {
    stat(fileName, (err, st) => {
      if (err) {
        reject(err);
      } else if (st.size > 10) {
        resolve();
      } else if (counter > 20) {
        reject("upload failed");
      } else {
        setTimeout(() => {
          waitUpload(fileName, counter + 1);
        }, 100);
      }
    })
  })
}

export function route(app) {
  app.post('/api/upload', (req, res) => {
    const form = new formidable.IncomingForm();
    form.hash = 'sha1';
    form.uploadDir = tempPath;
    form.parse(req, (err, fields, files) => {
      if (!files || !files.file) {
        return res.status(500).json({ err: "please choose a file" });
      }
      upload(files.file, 'images')
        .then((file) => {
          res.json(file);
        })
        .catch(err => {
          res.status(500).json({ err })
        })
    });
  });
}
