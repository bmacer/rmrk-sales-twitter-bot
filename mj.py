import os
import requests

client = os.environ["amp_client"]
api_key = os.environ["amp_api"]

d = {"name": "test"}

u = "https://api.amp.cisco.com/v1/event_streams"

r = requests.post(u, auth=(client,api_key), data=d)

print(r.json())
