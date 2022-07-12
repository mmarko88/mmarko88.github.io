FROM klakegg/hugo:ext-asciidoctor


RUN git config --global http.sslVerify false


ENTRYPOINT "/bin/hugo"