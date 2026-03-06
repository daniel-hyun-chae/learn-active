#!/usr/bin/env sh
set -e

mkdir -p "$HOME/.local/share/opencode"

if command -v opencode >/dev/null 2>&1; then
  opencode --version || true
  exit 0
fi

INSTALL_URL="https://opencode.ai/install"
CA_CERT_DEFAULT="$HOME/.config/opencode/ca-certificates.crt"
CA_CERT="${OPENCODE_CA_CERT:-$CA_CERT_DEFAULT}"
INSECURE="${OPENCODE_INSTALL_INSECURE:-0}"

export NPM_CONFIG_PREFIX="$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"

if [ -f "$CA_CERT" ]; then
  export NODE_EXTRA_CA_CERTS="$CA_CERT"
fi

install_with_curl() {
  if [ "$INSECURE" = "1" ]; then
    curl -k -fsSL "$INSTALL_URL" | bash
    return
  fi

  if [ -f "$CA_CERT" ]; then
    curl --cacert "$CA_CERT" -fsSL "$INSTALL_URL" | bash
    return
  fi

  curl -fsSL "$INSTALL_URL" | bash
}

if install_with_curl; then
  opencode --version || true
  exit 0
fi

echo "OpenCode install via curl failed; trying npm global install."

if [ "$INSECURE" = "1" ]; then
  npm config set strict-ssl false
fi

if npm install -g opencode-ai; then
  opencode --version || true
  exit 0
fi

echo "OpenCode install failed. If you are behind a proxy, add a CA cert at $CA_CERT and re-run this script."
echo "You may also set OPENCODE_INSTALL_INSECURE=1 to bypass TLS verification (not recommended)."
exit 0
