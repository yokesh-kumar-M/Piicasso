FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf || true
COPY nginx.conf /etc/nginx/nginx.conf.template
EXPOSE 80

# Extract the local DNS resolver dynamically and substitute Render internal private hostports
CMD ["/bin/sh", "-c", "echo \"resolver $(awk 'BEGIN{ORS=\" \"} $1==\"nameserver\" {print $2}' /etc/resolv.conf) valid=10s ipv6=off;\" > /etc/nginx/resolvers.conf && envsubst \"\\$IDENTITY_SERVICE_HOSTPORT \\$CORE_ENGINE_HOSTPORT\" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
