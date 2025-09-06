# Build stage
FROM node:18-bullseye AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# تأكد أن "npm run build" يخرج إلى مجلد dist (لو اسم مشروعك داخل dist/<name> لا مشكلة)
RUN npm run build

# Run stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
