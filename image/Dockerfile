FROM ubuntu:18.04
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget ca-certificates \
    && wget https://github.com/eosio/eosio.cdt/releases/download/v1.6.1/eosio.cdt_1.6.1-1_amd64.deb \
    && apt install -y ./eosio.cdt_1.6.1-1_amd64.deb \
    && wget https://github.com/eosio/eos/releases/download/v1.8.1/eosio_1.8.1-1-ubuntu-18.04_amd64.deb \
    && apt install -y ./eosio_1.8.1-1-ubuntu-18.04_amd64.deb \
    && apt-get remove -y wget ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
