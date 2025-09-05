# استخدم نسخة خفيفة من Node.js
FROM node:20-alpine

# اعمل مجلد للتطبيق
WORKDIR /app

# انسخ ملفات package.json و package-lock.json
COPY package*.json ./

# ثبت الاعتمادات
RUN npm install -g @angular/cli@16.2.0   # إذا تحتاجي نسخة محددة من Angular
RUN npm install

# انسخ باقي ملفات المشروع
COPY . .

# ابني المشروع
RUN ng build --configuration production

# استخدم Nginx لتقديم ملفات الـ frontend
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

# افتح البورت
EXPOSE 80

# شغّل Nginx
CMD ["nginx", "-g", "daemon off;"]



