# Frontend container — Phase 1 placeholder.
# Serves a static landing page that confirms the stack is alive.
# Will be replaced with the real app in Phase 2.

FROM nginx:1.27-alpine

# Drop the default config and use ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets
COPY public/ /usr/share/nginx/html/

# Healthcheck just hits the landing page
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --spider --quiet http://127.0.0.1/ || exit 1

EXPOSE 80
