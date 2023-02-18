FROM mongo:5.0
COPY cybersquat_known_sites.json /cybersquat_known_sites.json
COPY keyword_blacklist.json /keyword_blacklist.json
CMD mongoimport --uri mongodb://mongodb:27017/link_inspection --collection cybersquat_known_sites --file /cybersquat_known_sites.json --jsonArray && \
    mongoimport --uri mongodb://mongodb:27017/link_inspection --collection keyword_blacklist  --file /keyword_blacklist.json --jsonArray