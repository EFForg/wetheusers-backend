#!/bin/bash
NODE_CONFIG="{\"REDIS\": {\"URL\": \"$REDIS_PORT_6379_TCP_ADDR\"}}" $@
