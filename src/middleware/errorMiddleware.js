// This middleware is to overide the default express error handler i.e we won't have that stupid html page when we throw an error and now we can decide to throw an error in the response whenever we have an error and it will be displayed properly.

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    // stack: err.stack,
  });
};

module.exports = { errorHandler };
