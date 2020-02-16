FROM ubuntu:18.04
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget ca-certificates software-properties-common \
    && wget https://github.com/EOSIO/eosio.cdt/releases/download/v1.7.0/eosio.cdt_1.7.0-1-ubuntu-18.04_amd64.deb \
    && apt install -y ./eosio.cdt_1.7.0-1-ubuntu-18.04_amd64.deb \
    && wget https://github.com/EOSIO/eos/releases/download/v2.0.3/eosio_2.0.3-1-ubuntu-18.04_amd64.deb \
    && apt install -y ./eosio_2.0.3-1-ubuntu-18.04_amd64.deb \
    && apt-get remove -y wget ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && cd /usr/opt/eosio.cdt/1.7.0/bin \
    # Hack to fix multithreading issue in eosio.cdt 1.7.0
    && mv wasm-ld wasm-ld.real \
    && echo '#!/bin/bash' > wasm-ld \
    && echo '`dirname $0`/wasm-ld.real --no-threads "$@"' >> wasm-ld \
    && chmod +x /usr/opt/eosio.cdt/1.7.0/bin/wasm-ld
