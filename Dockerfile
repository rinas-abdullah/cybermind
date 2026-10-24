# رصد سايبر (Rasd Cyber) — production image.
# Runs the Express server straight from source (it serves the frontend too),
# so no build step is needed. Works on any container host (Railway, Fly.io,
# Cloud Run, a VPS). Provide JWT_SECRET at runtime; the platform sets PORT.
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first for better layer caching.
COPY package*.json ./
RUN npm install --omit=dev

# App source (frontend assets are served by the same server).
COPY . .

ENV NODE_ENV=production
ENV DB_TYPE=in-memory
ENV HOST=0.0.0.0
# PORT is provided by the host at runtime; 3001 is only the local default.
EXPOSE 3001

# JWT_SECRET (32+ chars) and SITE_URL (your public URL) must be supplied at
# runtime, e.g.:
#   docker run -e JWT_SECRET=<32+ char secret> -e SITE_URL=http://localhost:3001 \
#     -p 3001:3001 rasd-cyber
CMD ["node", "backend/server.js"]
