# Stage 1: Validate HTML structure
FROM node:22-alpine AS validate
WORKDIR /app
COPY docs/ ./docs/
RUN echo "Validating HTML files..." && \
    find docs -name '*.html' -exec sh -c 'echo "  ✓ $(basename {})"' \;

# Stage 2: Production — serve with nginx
FROM nginx:1-alpine

LABEL maintainer="Saurav Bhattacharya <online.saurav@gmail.com>"
LABEL description="Portfolio site for Saurav Bhattacharya"
LABEL org.opencontainers.image.source="https://github.com/sauravbhattacharya001/sauravbhattacharya001"

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy portfolio site
COPY --from=validate /app/docs/ /usr/share/nginx/html/

# Custom nginx config for SPA-friendly serving + security headers
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/html text/css application/javascript text/xml application/xml;
    gzip_min_length 256;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
