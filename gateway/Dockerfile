FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf || true
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
