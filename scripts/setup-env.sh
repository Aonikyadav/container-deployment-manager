#!/bin/sh
# Shell Script Template for Container Configuration
# This script is meant to be invoked as an entrypoint or setup script inside the container

echo "Initializing Container Environment..."

# Example logic: Source any environment files mounted into the container
if [ -f "/app/.env" ]; then
    echo "Sourcing environment variables from /app/.env"
    set -a
    source /app/.env
    set +a
fi

# Example logic: Perform application specific setup
if [ -d "/app/config-scripts" ]; then
    echo "Running configuration scripts..."
    for script in /app/config-scripts/*.sh; do
        if [ -x "$script" ]; then
            echo "Executing $script"
            "$script"
        fi
    done
fi

echo "Environment setup complete."

# Hand over control to the main container command
exec "$@"
