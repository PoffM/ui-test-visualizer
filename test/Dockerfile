FROM codercom/code-server:4.96.4

ENV NODE_VERSION=22.14.0
# installs NVM (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
ENV NVM_DIR=/home/coder/.nvm

USER coder

# download and install Node.js
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}

COPY --chown=coder ./.vscode/settings.json /home/coder/.local/share/code-server/User/settings.json
