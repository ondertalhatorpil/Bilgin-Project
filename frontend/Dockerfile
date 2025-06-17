# Multi-stage build - React uygulamasını build et
FROM node:18-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# Tüm dosyaları kopyala
COPY . .

# Dependencies yükle (dev dependencies dahil - build için gerekli)
RUN npm install

# react-scripts'in yüklendiğini kontrol et
RUN ls -la node_modules/.bin/ | grep react-scripts || echo "react-scripts not found"

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