FROM node:alpine
MAINTAINER Oleg Makarov <om@bankexfoundation.org>

RUN mkdir /oc_donators_cab

WORKDIR /oc_donators_cab

RUN mkdir /oc_donators_cab/abi
ADD /build /oc_donators_cab/build
ADD /config /oc_donators_cab/config
ADD /public /oc_donators_cab/public
ADD /server /oc_donators_cab/server
ADD /tests /oc_donators_cab/tests
ADD /package.json /oc_donators_cab/package.json
ADD /node_modules /oc_donators_cab/node_modules

RUN sed -i "s#EMAILSTAGE#$EMAILSTAGE#" /oc_donators_cab/config/staging.yaml
RUN sed -i "s#EMAILHOSTSTAGE#$EMAILHOSTSTAGE#" /oc_donators_cab/config/staging.yaml
RUN sed -i "s#EMAILPASSSTAGE#$EMAILPASSSTAGE#" /oc_donators_cab/config/staging.yaml
RUN sed -i "s#EMAILSTAGE#$EMAILSTAGE#" /oc_donators_cab/config/production.yaml
RUN sed -i "s#EMAILHOSTSTAGE#$EMAILHOSTSTAGE#" /oc_donators_cab/config/production.yaml
RUN sed -i "s#EMAILPASSSTAGE#$EMAILPASSSTAGE#" /oc_donators_cab/config/production.yaml
RUN sed -i "s#JWTSECRETSTAGE#$JWTSECRETSTAGE#" /oc_donators_cab/config/staging.yaml
RUN sed -i "s#JWTSECRETPROD#$JWTSECRETPROD#" /oc_donators_cab/config/staging.yaml
RUN sed -i "s@testpass@$MONGODB_STAGE_PASS@" /oc_donators_cab/config/staging.yaml
RUN sed -i "s@testpass@$MONGODB_PROD_PASS@" /oc_donators_cab/config/production.yaml

EXPOSE 80

