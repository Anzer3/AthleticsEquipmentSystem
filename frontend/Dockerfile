# 1. Base image
FROM node:20-alpine

# 2. Pracovní adresář
WORKDIR /app

# 3. Zkopíruj package.json a nainstaluj závislosti
COPY package.json package-lock.json ./
RUN npm install

# 4. Zkopíruj celý frontend
COPY . .

# 5. Expose port (Vite dev server / preview)
EXPOSE 3001

# 6. Spustit dev server (pro development)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# 6b. Nebo production preview (po build)
# CMD ["sh", "-c", "npm run build && npm run preview -- --port 3001 --host 0.0.0.0"]
