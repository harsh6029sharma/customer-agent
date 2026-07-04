FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]