require('dotenv').config({ path: __dirname + '/.env' })

module.exports = {
  apps: [
    {
      name: 'frangere',
      script: '.output/server/index.mjs',
      cwd: __dirname,
      interpreter: '/home/debian/.nvm/versions/node/v20.20.2/bin/node',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT,
        HOST: process.env.HOST,
        DATABASE_URL: process.env.DATABASE_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        CRON_ENABLED: process.env.CRON_ENABLED,
        CRON_SCHEDULE: process.env.CRON_SCHEDULE,
        CRON_SECRET: process.env.CRON_SECRET
      }
    }
  ]
}
