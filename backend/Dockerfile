FROM node:24-alpine

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]
