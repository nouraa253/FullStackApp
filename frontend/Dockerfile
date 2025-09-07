# ===== Build Angular =====
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# اجمع مخرجات dist بغض النظر عن اسم مجلد المشروع
RUN sh -c 'set -e; mkdir -p /out; p=$(ls -d dist/* 2>/dev/null || echo dist); cp -r "$p"/* /out/'

# ===== Nginx Runtime =====
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*              # احذف صفحة الترحيب
COPY nginx.conf /etc/nginx/conf.d/default.conf  # لو عندك كونفج مخصص
COPY --from=build /out/ /usr/share/nginx/html/  # انسخ ملفات Angular للجذر
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
