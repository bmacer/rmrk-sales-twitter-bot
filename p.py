#!/usr/bin/env python

import argparse
import pika
import pprint
import requests

# YOU NEED TO CREATE AN auth.py FILE WITH CLIENT_ID AND API_KEY STRINGS
from auth import CLIENT_ID, API_KEY, ESTREAM_ID, ESTREAM_PASS

x = f"well well well {CLIENT_ID}"
print(x)

parser = argparse.ArgumentParser()
parser.add_argument('event_stream_name', metavar='event_stream_name',
                    nargs=1, help='event stream name')
parser.parse_args()
event_stream_name = parser.parse_args().event_stream_name[0]

api_endpoint = 'https://api.amp.cisco.com/v1/event_streams'

session = requests.Session()
session.auth = (CLIENT_ID, API_KEY)

event_streams = session.get(api_endpoint).json()['data']

event_stream = {}

for e in event_streams:
    if e['name'] is event_stream_name:
        event_stream = e


# amqp_url = # 'amqps://16772-5724fe991e688690bf20:f55527c45960e8843fec0abfbc09d4e6128e18ce@export-streaming.amp.cisco.com:443'
amqp_url = f"amqps://{ESTREAM_ID}:{ESTREAM_PASS}@export-streaming.amp.cisco.com:443"
queue = e['amqp_credentials']['queue_name']
#queue = 'event_stream_16772'
parameters = pika.URLParameters(amqp_url)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()


parameters = pika.URLParameters(amqp_url)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()


def callback(ch, method, properties, body):
    print(" [x] Received meth:\t%r" % method)
    print(" [x] Received prop:\t%r" % properties)
    print(" [x] Received body:\t%r" % body)

#channel.queue_declare(queue, durable = False, auto_delete = True)
channel.basic_consume(queue, callback, auto_ack=False) # True = ACK the message to RMQ / False = NO ACK to RMQ, message count stays consistent

print(" [*] Connecting to:\t%r" % amqp_url)
print(" [*] Waiting for messages. To exit press CTRL+C")
channel.start_consuming() 
