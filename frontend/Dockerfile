# ===== Build Angular =====
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# ابني نسخة الإنتاج
RUN npm run build -- --configuration production

# ===== Nginx Runtime =====
FROM nginx:alpine

# استخدم كونفج يدعم SPA (يرجع index.html لأي مسار)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# انسخ ناتج البناء. ملاحظة: مجلد dist يكون dist/<project-name>
# لذا استخدمنا وايلدكارد لنسخ أول مجلد داخل dist أيّاً كان اسمه:
COPY --from=build /app/dist/*/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
