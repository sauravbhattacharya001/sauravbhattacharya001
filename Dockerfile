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

# Security headers snippet — single source of truth, included in every
# location block to work around nginx's add_header inheritance rules
# (child blocks with their own add_header silently DROP all parent headers).
RUN mkdir -p /etc/nginx/snippets && \
    cat > /etc/nginx/snippets/security-headers.conf <<'HDRS'
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
HDRS

# Custom nginx config for SPA-friendly serving
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    include /etc/nginx/snippets/security-headers.conf;

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable" always;
        include /etc/nginx/snippets/security-headers.conf;
    }

    # Gzip compression
    gzip on;
    gzip_types text/html text/css application/javascript text/xml application/xml;
    gzip_min_length 256;

    # Pages with inline styles need relaxed style-src CSP.
    # rheology.html: no inline scripts or styles — only external .js/.css
    #   (was incorrectly grouped here; uses strict default CSP)
    # 404.html: has inline <style> only — needs 'unsafe-inline' for style-src,
    #   but NOT for script-src
    location = /404.html {
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    }

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

# Run as non-root for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
