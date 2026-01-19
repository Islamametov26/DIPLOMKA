# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . ./

EXPOSE 5173

ENV VITE_API_BASE_URL=http://localhost:8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
