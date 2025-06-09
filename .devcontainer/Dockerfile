# Use Node.js 24 official image as base
FROM node:24-bookworm

# Install additional system dependencies and set up sudo
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        # Build tools for native modules
        build-essential \
        python3-dev \
        # Additional utilities
        curl \
        wget \
        unzip \
        # For better terminal experience
        git \
        vim \
        nano \
        sudo \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* \
    && echo 'node ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node \
    && usermod -aG sudo node

# Switch to node user for npm configuration
USER node

# Configure npm settings to suppress unnecessary output (user-level config)
RUN npm config set fund false \
    && npm config set update-notifier false

# Set environment variables for development
ENV NODE_ENV=development
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Set working directory
WORKDIR /workspaces

# Create a script to fix permissions that can be run at container startup
USER root
RUN echo '#!/bin/bash' > /usr/local/bin/fix-workspace-permissions \
    && echo 'sudo chown -R node:node /workspaces/${WORKSPACE_NAME:-$(basename "$(pwd)")} 2>/dev/null || true' >> /usr/local/bin/fix-workspace-permissions \
    && echo 'sudo chmod -R 755 /workspaces/${WORKSPACE_NAME:-$(basename "$(pwd)")} 2>/dev/null || true' >> /usr/local/bin/fix-workspace-permissions \
    && chmod +x /usr/local/bin/fix-workspace-permissions

# Switch back to node user (default for container execution)
USER node
