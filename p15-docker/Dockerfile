# Imagen base — Node 20 en Alpine (versión liviana de Linux)
FROM node:24-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar primero los archivos de dependencias
# (Docker cachea esta capa si package.json no cambió)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Puerto que expone la app
EXPOSE 3001

# Comando que se ejecuta al iniciar el contenedor
CMD ["node", "index.js"]

# Construir la imagen con el tag "contador"
# docker build -t contador .

# Correr el contenedor
# docker run -p 3000:3000 contador