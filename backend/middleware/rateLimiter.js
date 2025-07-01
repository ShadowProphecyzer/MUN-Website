const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for contact form submissions
const contactFormRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  points: 1000, // Number of requests (increased to 1000)
  duration: 900, // Per 15 minutes (900 seconds)
  blockDuration: 300, // Block for 5 minutes if limit exceeded (reduced for development)
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await contactFormRateLimiter.consume(req.ip || req.connection.remoteAddress || 'unknown');
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: secs
    });
  }
};

module.exports = rateLimiterMiddleware; 