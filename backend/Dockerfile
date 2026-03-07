FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances et installer uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code source
COPY src/ ./src/

# Déclarer le volume de données (monter un volume externe pour persister la base SQLite)
VOLUME ["/app/data"]

# Attribuer les droits à l'utilisateur node
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "src/index.js"]
