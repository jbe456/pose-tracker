# Default ports
SERVER_JS_PORT := env("SERVER_JS_PORT", "3000")
CLIENT_PORT := env("CLIENT_PORT", "5173")

# Install client
install-client:
  @set -e
  npm install --prefix client

# Install JS server
install-server-js:
  @set -e
  npm install --prefix server-js

# One-shot: install everything
install: install-client install-server-js
  @echo "✅ Installed client and server-js."

# Run client
run-client:
  @echo "🎨 Client on http://localhost:{{CLIENT_PORT}}"
  CLIENT_PORT={{CLIENT_PORT}} npm run dev --prefix client 2>&1 | sed -u "s/^/[client] /"

# Run JS server
run-server-js:
  @echo "🚀 JS Server on http://localhost:{{SERVER_JS_PORT}}"
  SERVER_JS_PORT={{SERVER_JS_PORT}} npm run dev --prefix server-js 2>&1 | sed -u "s/^/[server-js] /"

# Run both backend and frontend together; Ctrl-C stops both
[parallel]
run: run-client run-server-js