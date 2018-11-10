# eosio-operator

This package installs executables for managing your local
EOSIO testnet both from Docker and from locally installed binaries.
It recommended to install it globally for ease of access to the
executables, but it can also be installed inside a project
as a dependency to access utility functions for creating seed data.

## Docker

- `eosop-docker setup` prepares the environment and pulls the docker image.
- `eosop-docker start` starts the container running nodeos and stores its data
  in the current directory under the `data` subdirectory.
- `eosop-docker tail` tails the nodeos log.
- `eosop-docker stop` stops the running container.

# Local installation

- `eosop-local start` starts nodeos and stores its data
  in the current directory under the `data` subdirectory.
- `eosop-local tail` tails the nodeos log.
- `eosop-local stop` stops the nodeos background process.
