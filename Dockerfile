# Build on the host CPU. dist is arch-independent; Node 22 under QEMU hits SIGILL.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime must be arm64: every k3s node is a Raspberry Pi. Pinned explicitly
# rather than inherited from the build invocation, so a plain `docker build`
# on an amd64 host cannot silently produce an unrunnable image.
FROM --platform=linux/arm64 nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
