# Get all collections with at least 4 listings in db
SELECT COUNT(*), * FROM listings GROUP BY collection HAVING COUNT(collection) > 3;

# Get all listings within the last 10 blocks
SELECT * FROM listings WHERE block >= (SELECT number-10 FROM latest_block);