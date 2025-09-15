const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const backendPort = process.env.BACKEND_PORT || 3010;
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://localhost:${backendPort}`,
      changeOrigin: true,
    })
  );
  
  console.log(`Frontend proxy configured to route /api/* to http://localhost:${backendPort}`);
};