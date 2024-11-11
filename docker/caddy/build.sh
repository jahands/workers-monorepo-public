#!/bin/sh

VARIANT=$1

if [ -z "$VARIANT" ]; then
	echo "Please provide a variant"
	exit 1

elif [ "$VARIANT" = "latest" ]; then
	xcaddy build \
		--with github.com/caddy-dns/cloudflare

elif [ "$VARIANT" = "dockerproxy" ]; then
	xcaddy build \
		--with github.com/caddy-dns/cloudflare \
		--with github.com/lucaslorentz/caddy-docker-proxy/v2

else
	echo "Unknown variant: $VARIANT"
	exit 2
fi
