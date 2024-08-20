# NOTE: must use --secret when building, e.g.
#
#   export NPM_TOKEN=<token>
#   docker build --secret id=NPM_TOKEN .
#
# This keeps the NPM token out of the image history
# NPM_TOKEN needs access to the @integrationos organization in NPM

FROM node:16.13.0

# Working directory
WORKDIR /app

# Copy source
COPY . .

# Install dependencies
RUN --mount=type=secret,id=NPM_TOKEN NPM_TOKEN=$(cat /run/secrets/NPM_TOKEN) npm i --ignore-scripts

# Build
RUN npm run build

# Start server
CMD ["npm", "start"]
