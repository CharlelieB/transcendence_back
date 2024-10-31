FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf 
RUN mkdir -p /etc/nginx/certs/
COPY certs/ /etc/nginx/certs/
#COPY frontend/ /usr/share/nginx/html
#RUN mkdir -p /www/media/
#COPY media/ /www/media/
