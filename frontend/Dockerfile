# ===== Build Angular =====
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production
# الناتج يكون في dist/frontend (حسب angular.json)

# ===== Nginx Runtime =====
FROM nginx:alpine
# احذف صفحة Nginx الافتراضية
RUN rm -rf /usr/share/nginx/html/*
# إعدادات Nginx (الجذر مضبوط على /usr/share/nginx/html/frontend)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# انسخ مجلد dist بالكامل ليظهر مجلد "frontend" تحت html
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
