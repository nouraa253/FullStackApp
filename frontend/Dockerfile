# ===== Build Angular =====
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# ===== Nginx Runtime =====
FROM nginx:alpine
# احذف صفحة Nginx الافتراضية
RUN rm -rf /usr/share/nginx/html/*
# ملف إعدادات Nginx (في نفس مجلد frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# انسخ مخرجات Angular إلى الجذر مباشرة
COPY --from=build /app/dist/frontend/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
