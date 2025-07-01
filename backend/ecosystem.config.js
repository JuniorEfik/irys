// backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'irys-file-share',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    log_file: '../logs/combined.log',
    time: true,
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    // Memory and CPU limits
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};