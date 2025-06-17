# Multi-stage build - React uygulamasını build et
FROM node:18-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# Package.json dosyalarını kopyala
COPY package*.json ./

# Dependencies yükle
RUN npm ci --only=production

# Kaynak kodları kopyala
COPY . .

# React uygulamasını build et
RUN npm run build

# Production stage - Nginx ile serve et
FROM nginx:alpine

# Build edilmiş dosyaları nginx'e kopyala
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx konfigürasyonunu kopyala
COPY nginx.conf /etc/nginx/nginx.conf

# Port 80'i expose et
EXPOSE 80

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]