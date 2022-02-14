# 🚀 Build the runner image
FROM node:17.0-slim
COPY . .
RUN npm install
CMD [ "node", "index.js" ]
