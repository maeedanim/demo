# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine

# # Use production node environment by default.
# ENV NODE_ENV production


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
# RUN --mount=type=bind,source=package.json,target=package.json \
#     --mount=type=bind,source=package-lock.json,target=package-lock.json \
#     --mount=type=cache,target=/root/.npm \
#     npm ci --omit=dev

##!! keep it during production build
COPY package*.json ./
RUN npm install
COPY . ./
# RUN rm -f .env


# Expose the port that the application listens on.
EXPOSE 4000

# RUN --mount=type=bind,source=.env,target=.env

# Run the application.
# CMD npm run start:dev
# CMD ["npm", "install", "&&", "npm", "run", "start:dev"]
# CMD ["sh", "-c", "npm install && npm run start:dev"]
# ENTRYPOINT ["sh", "-c", "npm install && npm run start:dev"]
CMD ["sh", "-c", "npm install && npm run start:dev"]


