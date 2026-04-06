FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf || true
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

# Extract the local DNS resolver dynamically to prevent startup crashes when backend isn't ready
CMD ["/bin/sh", "-c", "echo \"resolver $(awk 'BEGIN{ORS=\" \"} $1==\"nameserver\" {print $2}' /etc/resolv.conf) valid=10s ipv6=off;\" > /etc/nginx/resolvers.conf && nginx -g 'daemon off;'"]
