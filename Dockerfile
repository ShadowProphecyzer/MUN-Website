# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy backend package files first for caching efficiency
COPY backend/package*.json ./backend/

# Install backend dependencies
# Using --prefix avoids changing the directory for this single command
RUN npm install --prefix backend

# Copy the rest of the backend code
COPY backend/ ./backend/

# Expose the port your app runs on (Railway will detect this automatically but it's good practice)
EXPOSE 3000

# Command to run your server
CMD ["node", "backend/server.js"] 