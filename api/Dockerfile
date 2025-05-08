FROM nginx:alpine

# Swagger UIのファイルをダウンロード
RUN apk add --no-cache curl && \
    curl -L https://github.com/swagger-api/swagger-ui/archive/refs/tags/v4.15.5.tar.gz | tar xz && \
    mv swagger-ui-4.15.5/dist/* /usr/share/nginx/html/ && \
    rm -rf swagger-ui-4.15.5

# 設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY openapi.yaml /usr/share/nginx/html/
COPY index.html /usr/share/nginx/html/

EXPOSE 80 