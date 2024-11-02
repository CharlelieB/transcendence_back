FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY website.conf /etc/nginx/sites-available/
RUN mkdir -p /etc/nginx/sites-enabled && ln -s /etc/nginx/sites-available/website.conf /etc/nginx/sites-enabled/
RUN rm -f /etc/nginx/sites-enabled/default

RUN mkdir -p /etc/nginx/certs/
RUN mkdir -p /www/media/
COPY certs/ /etc/nginx/certs/
