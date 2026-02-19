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
COPY nginx.conf.proxy.template /etc/nginx/conf.d/
COPY nginx.conf.noproxy.template /etc/nginx/conf.d/

ENV PORT=80

EXPOSE 80

CMD ["sh", "-c", "export PORT=${PORT:-80} && if [ -n \"$BACKEND_URL\" ]; then envsubst '${BACKEND_URL} ${BACKEND_HOST} ${PORT}' < /etc/nginx/conf.d/nginx.conf.proxy.template > /etc/nginx/conf.d/default.conf; else envsubst '${PORT}' < /etc/nginx/conf.d/nginx.conf.noproxy.template > /etc/nginx/conf.d/default.conf; fi && exec nginx -g 'daemon off;'"]
