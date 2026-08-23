function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with these details already exists' });
  }
  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.stack || err.message,
  });
}

module.exports = { notFound, errorHandler };
