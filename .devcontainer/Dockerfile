# ARG VARIANT="20-bullseye"
# FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

# RUN echo "-----BEGIN CERTIFICATE-----\nMIIFDzCCAvegAwIBAgIQQbUrSPfd961GEZiFMydNvjANBgkqhkiG9w0BAQsFADAa\nMRgwFgYDVQQDEw9Lb2VyYmVyLVJvb3QtQ0EwHhcNMTcwNzEzMTU0MDMwWhcNMzcw\nNzEzMTU1MDI5WjAaMRgwFgYDVQQDEw9Lb2VyYmVyLVJvb3QtQ0EwggIiMA0GCSqG\nSIb3DQEBAQUAA4ICDwAwggIKAoICAQC8jPvDf85jdigEhIoH+qQivfrt+pdz3PJy\nk3fUukkGCag7VwTF8FrPlqFk/eP3a1Tleakls6p0WMEMIXc6MF//X23ClaHRaToe\n193INh/CWbEPdEjdK57BvxovurYRzqucyT+Eys0fZ0h7ZQINZVYZgxJvj5YFtYaV\nOHsKmRsb3b7DH03FoaBud9v/GpvoTPzTXiC0i7p47mWEp+IWvwh6j4ZgkC/mzYva\nYZUzuQWLYawSCous+7+IEQWLhp7faF89SBVroc16Ey8MZg6uui2QAOE9YLn+7Sif\nUrE6hHgXhfwpDcK21KBJx+W/naBdoRPjl3kv9Y2KG6x/HgXh/gP6SLluokrj6lOk\n03Xtb4NGPH8tOea9gDgMv4DwkXMBwFkjA9sUi445HODVKmf129FGHaGkd9oZTIUa\n3LacX3Fs9/w+0bci+AKTXXYTFLHRnvT3LfOH8SdpEn6tYrvuzPpJew/79tj4GhhO\ndugga1GA3KBde9AmcXcOEG1pfhCH4hO/t1+jdTkWhPrHnN8hzgeWpHoJzeQYExCh\nlKCyuWZa7/GKjmMvAi06ZMYeY4LhwUG0Fqbfja1ByJu3m1lfJqClzbZpYFpEiUxh\n0tFoBKtI23C9OXnDOQLvydMMSjvuGvssAcmHisWitzOoklxMnJ3jcW0jTNw5gDgj\nb/1wHXXkgQIDAQABo1EwTzALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAd\nBgNVHQ4EFgQUn3cK+eUNjZaoNoW4StuWsLXd7K0wEAYJKwYBBAGCNxUBBAMCAQAw\nDQYJKoZIhvcNAQELBQADggIBAEFeDE4PTr2clTeSkLxJHD0Gu265hpzWTKPItvlz\n2WeRSzGamr3rWpIReJfdt6oTiKobuiy5tSGGsjXkmYtl3Pzwekdm99PiVBj8i9Sa\nS1RNS+i35tAIkfDa6VifTlbJVnbx8u6pg2tBob63tZGm2/BuvY30LUHtQvv6rAnq\nHwd5YA49kz5pILDq0PU8GN4R94I1Nud68c+naAo45rudrbiOuhOiiw1v90YhVQ+3\nyYC7oMSre3Tf5DU3qWhNjI7QAUFEKB7FmZYkl8rtfM/cCDjLII7PHaDXaPtW6oLo\nTYjtvH2/0z0vppoCIKTx4LVuPqvVR0xBZhow58J0IiSF9cilO9YseceNKlqnpAa6\n5cqg+VAZ6mVel2n8GjcqTL8Z0w1pngUElVAV+8Yd5z5KaaNgoHVyCiLyLee5E5fL\nhJ0pGdVahBMSG+h3KSvYyGEP4lHN3r7vfFJVUJaCwYKghMkoJ1v/rgYDIjyndaD1\nzXoqAE0tXd74e28zRLTW2BEJ2JPgGcW2QE7Km0CiUcWTmXR+KYtnIhMzhASTxWp0\n5Hy3KwhZO+kNbBHlIH6BcL3VZvGA5+TBn39dxV/uY6RjeU+afCakqiYtmdR7mUqS\nPn6C7EAPaAjiL95Hdk4SY0CTWYNDxxuemAbXUQ09josdiUKwWyFTmjHif0e+C5zB\nsgWt\n-----END CERTIFICATE-----\n" | sudo tee /usr/share/ca-certificates/Koerber_root_CA.crt
# RUN echo "Koerber_root_CA.crt" | sudo tee -a /etc/ca-certificates.conf
# RUN sudo update-ca-certificates
# ENV NODE_EXTRA_CA_CERTS=/usr/share/ca-certificates/Koerber_root_CA.crt

# RUN corepack enable \
#   && corepack prepare pnpm@9.12.2 --activate

# RUN mkdir -p /workspaces/learn-active \
#   && chown -R node:node /workspaces

# RUN groupadd -f vscode \
#   && if ! id -u vscode >/dev/null 2>&1; then useradd -m -s /bin/bash -g vscode vscode; fi

# RUN curl -fsSL https://opencode.ai/install -o /tmp/install_opencode.sh \
#     && chmod +x /tmp/install_opencode.sh \
#     && OPENCODE_INSTALL_DIR=/usr/local/bin /tmp/install_opencode.sh \
#     && rm /tmp/install_opencode.sh \
#     && (command -v opencode >/dev/null || install -m 0755 /root/.opencode/bin/opencode /usr/local/bin/opencode)

# RUN mkdir -p /home/vscode/.local/share/opencode \
#     && chown -R vscode:vscode /home/vscode/.local

# WORKDIR /workspaces/learn-active

ARG VARIANT="20-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

ARG PLAYWRIGHT_VERSION="1.55.0"

RUN cat > /usr/share/ca-certificates/Koerber_root_CA.crt <<'EOF'
-----BEGIN CERTIFICATE-----
MIIFDzCCAvegAwIBAgIQQbUrSPfd961GEZiFMydNvjANBgkqhkiG9w0BAQsFADAa
MRgwFgYDVQQDEw9Lb2VyYmVyLVJvb3QtQ0EwHhcNMTcwNzEzMTU0MDMwWhcNMzcw
NzEzMTU1MDI5WjAaMRgwFgYDVQQDEw9Lb2VyYmVyLVJvb3QtQ0EwggIiMA0GCSqG
SIb3DQEBAQUAA4ICDwAwggIKAoICAQC8jPvDf85jdigEhIoH+qQivfrt+pdz3PJy
k3fUukkGCag7VwTF8FrPlqFk/eP3a1Tleakls6p0WMEMIXc6MF//X23ClaHRaToe
193INh/CWbEPdEjdK57BvxovurYRzqucyT+Eys0fZ0h7ZQINZVYZgxJvj5YFtYaV
OHsKmRsb3b7DH03FoaBud9v/GpvoTPzTXiC0i7p47mWEp+IWvwh6j4ZgkC/mzYva
YZUzuQWLYawSCous+7+IEQWLhp7faF89SBVroc16Ey8MZg6uui2QAOE9YLn+7Sif
UrE6hHgXhfwpDcK21KBJx+W/naBdoRPjl3kv9Y2KG6x/HgXh/gP6SLluokrj6lOk
03Xtb4NGPH8tOea9gDgMv4DwkXMBwFkjA9sUi445HODVKmf129FGHaGkd9oZTIUa
3LacX3Fs9/w+0bci+AKTXXYTFLHRnvT3LfOH8SdpEn6tYrvuzPpJew/79tj4GhhO
dugga1GA3KBde9AmcXcOEG1pfhCH4hO/t1+jdTkWhPrHnN8hzgeWpHoJzeQYExCh
lKCyuWZa7/GKjmMvAi06ZMYeY4LhwUG0Fqbfja1ByJu3m1lfJqClzbZpYFpEiUxh
0tFoBKtI23C9OXnDOQLvydMMSjvuGvssAcmHisWitzOoklxMnJ3jcW0jTNw5gDgj
b/1wHXXkgQIDAQABo1EwTzALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUn3cK+eUNjZaoNoW4StuWsLXd7K0wEAYJKwYBBAGCNxUBBAMCAQAw
DQYJKoZIhvcNAQELBQADggIBAEFeDE4PTr2clTeSkLxJHD0Gu265hpzWTKPItvlz
2WeRSzGamr3rWpIReJfdt6oTiKobuiy5tSGGsjXkmYtl3Pzwekdm99PiVBj8i9Sa
S1RNS+i35tAIkfDa6VifTlbJVnbx8u6pg2tBob63tZGm2/BuvY30LUHtQvv6rAnq
Hwd5YA49kz5pILDq0PU8GN4R94I1Nud68c+naAo45rudrbiOuhOiiw1v90YhVQ+3
yYC7oMSre3Tf5DU3qWhNjI7QAUFEKB7FmZYkl8rtfM/cCDjLII7PHaDXaPtW6oLo
TYjtvH2/0z0vppoCIKTx4LVuPqvVR0xBZhow58J0IiSF9cilO9YseceNKlqnpAa6
5cqg+VAZ6mVel2n8GjcqTL8Z0w1pngUElVAV+8Yd5z5KaaNgoHVyCiLyLee5E5fL
hJ0pGdVahBMSG+h3KSvYyGEP4lHN3r7vfFJVUJaCwYKghMkoJ1v/rgYDIjyndaD1
zXoqAE0tXd74e28zRLTW2BEJ2JPgGcW2QE7Km0CiUcWTmXR+KYtnIhMzhASTxWp0
5Hy3KwhZO+kNbBHlIH6BcL3VZvGA5+TBn39dxV/uY6RjeU+afCakqiYtmdR7mUqS
Pn6C7EAPaAjiL95Hdk4SY0CTWYNDxxuemAbXUQ09josdiUKwWyFTmjHif0e+C5zB
sgWt
-----END CERTIFICATE-----
EOF

RUN echo "Koerber_root_CA.crt" >> /etc/ca-certificates.conf \
    && update-ca-certificates

ENV NODE_EXTRA_CA_CERTS=/usr/share/ca-certificates/Koerber_root_CA.crt

RUN corepack enable \
    && corepack prepare pnpm@9.12.2 --activate

RUN mkdir -p /workspaces/learn-active \
    && chown -R node:node /workspaces

RUN curl -fsSL https://opencode.ai/install -o /tmp/install_opencode.sh \
    && chmod +x /tmp/install_opencode.sh \
    && OPENCODE_INSTALL_DIR=/usr/local/bin /tmp/install_opencode.sh \
    && rm /tmp/install_opencode.sh \
    && if [ ! -x /usr/local/bin/opencode ]; then \
         if [ -x /root/.opencode/bin/opencode ]; then \
           ln -sf /root/.opencode/bin/opencode /usr/local/bin/opencode; \
         else \
           echo "opencode binary not found after install"; \
           exit 1; \
         fi; \
       fi \
    && /usr/local/bin/opencode --version

RUN mkdir -p /home/node/.local/share/opencode \
    && chown -R node:node /home/node/.local

RUN npx -y playwright@${PLAYWRIGHT_VERSION} install-deps chromium

RUN mkdir -p /home/node/.cache/ms-playwright \
    && chown -R node:node /home/node/.cache

WORKDIR /workspaces/learn-active
