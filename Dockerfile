# Base image
FROM node:18

# Create and set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Start the application
ENTRYPOINT ["node", "main.js"]
