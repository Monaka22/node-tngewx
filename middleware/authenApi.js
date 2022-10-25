exports.verifyKey = async (req, res, next) => {
    try {
        const { apikey } = req.headers;
      if (apikey === process.env.API_KEY) {
        next();
      } else {
        const error = new Error('Not Found');
        error.status = 404;
        error.error = 'No header.';
        next(error);
      }
    } catch (e) {
      const error = new Error(e.message);
      error.status = 401;
      next(error);
    }
  };
  