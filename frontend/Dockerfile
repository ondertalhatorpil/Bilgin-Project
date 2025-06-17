# Multi-stage build - React uygulamasını build et
FROM node:18-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# Tüm dosyaları kopyala
COPY . .

# Debug - Node ve npm versiyonlarını kontrol et
RUN node --version && npm --version

# Dependencies yükle
RUN npm install --force

# Debug - Yüklenen paketleri kontrol et
RUN ls -la node_modules/.bin/ || echo "node_modules/.bin bulunamadı"
RUN npm list react-scripts || echo "react-scripts paketi bulunamadı"

# react-scripts'i global yükle ve kontrol et
RUN npm install -g react-scripts@5.0.1
RUN which react-scripts || echo "react-scripts PATH'de bulunamadı"

# React uygulamasını build et
RUN npx react-scripts build

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