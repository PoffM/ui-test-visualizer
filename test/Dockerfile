FROM node:22.20.0 AS node-stage
FROM oven/bun:1.3.0 AS bun-stage

FROM codercom/code-server:4.104.2

# Copy Node and Bun from their stages
COPY --from=bun-stage /usr/local/bin/bun /usr/local/bin/bun
COPY --from=node-stage /usr/local /usr/local

USER coder

# Install Bun VSCode extension
RUN code-server --install-extension oven.bun-vscode@0.0.31

COPY --chown=coder ./.vscode/settings.json /home/coder/.local/share/code-server/User/settings.json
