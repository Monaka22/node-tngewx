const listMimeType = ['image/jpeg', 'image/png'];

exports.fileUpload500K = (req, res, next) => {
  if (!req.files) {
    if (req.body.cover_img) {
      next();
    } else {
      const error = new Error('files is require');
      error.status = 400;
      next(error);
    }
  } else if (req.files.files.mimetype) {
    const fileMimeType = listMimeType.find((v) => v === req.files.files.mimetype);
    if (!fileMimeType) {
      const error = new Error('images accept only image/jpeg, image/png');
      error.status = 400;
      next(error);
    } else {
      const size = (req.files.files.size / 1024 / 1024).toFixed(2);
      console.log('size ==', size);
      if (Number(size) > 0.5) {
        const error = new Error('images size is over 500 KB');
        error.status = 400;
        next(error);
      } else {
        next();
      }
    }
  } else {
    const error = new Error('images is invalid mimetype');
    error.status = 400;
    next(error);
  }
};
exports.fileUpload2M = (req, res, next) => {
  //แก้ไขเป็น 10M แล้ว
  if (!req.files) {
    if (req.body.cover_img) {
      next();
    } else {
      const error = new Error('files is require');
      error.status = 400;
      next(error);
    }
  } else if (req.files.files.mimetype) {
    const fileMimeType = listMimeType.find((v) => v === req.files.files.mimetype);
    if (!fileMimeType) {
      const error = new Error('images accept only image/jpeg, image/png');
      error.status = 400;
      next(error);
    } else {
      const size = (req.files.files.size / 1024 / 1024).toFixed(2);
      if (Number(size) > 10) {
        const error = new Error('images size is over 2 MB');
        error.status = 400;
        next(error);
      } else {
        next();
      }
    }
  } else {
    const error = new Error('images is invalid mimetype');
    error.status = 400;
    next(error);
  }
};
exports.checkUpload = (files) => new Promise(((resolve, reject) => {
   //แก้ไขเป็น 10M แล้ว
  if (files.mimetype) {
    const fileMimeType = listMimeType.find((v) => v === files.mimetype);
    if (!fileMimeType) {
      const error = new Error('images accept only image/jpeg, image/png');
      error.status = 400;
      reject(error);
    } else {
      const size = (files.size / 1024 / 1024).toFixed(2);
      if (Number(size) > 10) {
        const error = new Error('images size is over 2 MB');
        error.status = 400;
        reject(error);
      } else {
        resolve();
      }
    }
  } else {
    const error = new Error('images is invalid mimetype');
    error.status = 400;
    reject(error);
  }
}));

