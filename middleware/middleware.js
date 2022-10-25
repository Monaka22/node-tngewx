const handlerError = (err, req, res, next) => {
  if (!err) {
    res.status(500).json({
      message: 'error',
      statusCode: 500,
      statusText: 'error',
    });
  } else if (err.status === 422) {
    res.status(err.status).json({
      message: err.message,
      statusCode: 422,
      statusText: 'error',
    });
  } else if (err.status === 404) {
    res.status(err.status).json({
      message: err.message,
      statusCode: 404,
      statusText: 'error',
    });
  } else if (err.status === 401) {
    res.status(err.status).json({
      message: err.message,
      statusCode: 401,
      statusText: 'error',
    });
  } else if (err.status === 400) {
    res.status(err.status).json({
      message: err.message,
      statusCode: 400,
      statusText: 'error',
    });
  } else if (err.status === 433) {
    res.status(err.status).json({
      message: err.message,
      statusCode: 433,
      statusText: 'error',
    });
  } else {
    res.status(err.status || 500).json({
      message: err.message,
      statusCode: 500,
      statusText: 'error',
    });
  }
};
const handlerErrorPath = (req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
};

module.exports = {
  handlerErrorPath,
  handlerError,
};
