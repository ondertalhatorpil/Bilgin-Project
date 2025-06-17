# Node.js resmi Alpine image kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package.json dosyalarını kopyala
COPY package*.json ./

# Dependencies yükle
RUN npm ci --only=production && npm cache clean --force

# Kaynak kodları kopyala
COPY . .

# Non-root user oluştur (güvenlik)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Dosya sahipliğini nodejs user'a ver
RUN chown -R nodejs:nodejs /app
USER nodejs

# Port 5001'i expose et
EXPOSE 5001

# Environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Health check ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001', (res) => { \
    if (res.statusCode === 200) process.exit(0); \
    else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Uygulamayı başlat
CMD ["node", "server.js"]