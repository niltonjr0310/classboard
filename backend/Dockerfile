# Imagem do backend do ClassBoard (Render)
FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# O generate só precisa de uma URL qualquer; a URL real vem das variáveis de ambiente do Render
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN npm run build

ENV NODE_ENV=production
# O Render define PORT; o main.ts já lê process.env.PORT
CMD ["node", "dist/main"]
