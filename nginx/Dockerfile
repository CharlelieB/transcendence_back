FROM nginx:latest
#FROM debian:bullseye

#RUN apt update -y && apt install -y nginx

#RUN rm /etc/nginx/conf.d/default.conf
#COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY website.conf /etc/nginx/sites-available/
RUN mkdir -p /etc/nginx/sites-enabled && ln -s /etc/nginx/sites-available/website.conf /etc/nginx/sites-enabled/
RUN rm -f /etc/nginx/sites-enabled/default

RUN mkdir -p /etc/nginx/certs/
RUN mkdir -p /www/media/
COPY certs/ /etc/nginx/certs/

#COPY     ./entrypoint.sh /
#RUN     chmod u+x /entrypoint.sh
#ENTRYPOINT  /entrypoint.sh
