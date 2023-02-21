mongoimport --uri "mongodb://localhost:27017/link-inspection" --collection cybersquat_known_sites --file ./mongo_seed/cybersquat_known_sites.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/link-inspection" --collection keyword_blacklist  --file ./mongo_seed/keyword_blacklist.json --jsonArray

echo "MongoDB Import Completed"
read
