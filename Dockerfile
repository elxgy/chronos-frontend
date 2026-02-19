FROM node:22-alpine AS builder

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

ENV BACKEND_URL=http://backend:8080
ENV BACKEND_HOST=backend
ENV PORT=80

EXPOSE 80

CMD ["sh", "-c", "export PORT=${PORT:-80} && envsubst '${BACKEND_URL} ${BACKEND_HOST} ${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
