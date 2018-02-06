FROM node:latest
MAINTAINER Oleg Makarov <om@bankexfoundation.org>

ADD /abi /
ADD /build /
ADD /config /
ADD /public /

EXPOSE 80

CMD ["npm", "run", "staging"]
