FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update  \
    && apt-get install -y wget \
    && apt-get install -y asciidoc \
    && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

ENV GO_VERSION 1.18.4
ENV HUGO_VERSION 0.101.0

RUN wget -O /tmp/go.tar.gz --no-check-certificate https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz \
    && tar -xf /tmp/go.tar.gz -C /usr/local  \
    && rm /tmp/go.tar.gz \
    && wget --no-check-certificate -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.deb  \
    && chmod +x /tmp/hugo.deb \
    && dpkg -i /tmp/hugo.deb \
    && ln /usr/local/bin/hugo /bin/hugo \
    && rm /tmp/hugo.deb

RUN git config --system http.sslverify false

ENV GOROOT="/opt/go/bin/go"
ENV PATH=$PATH:/usr/local/go/bin

EXPOSE 1313

WORKDIR /src

ENTRYPOINT ["hugo"]
