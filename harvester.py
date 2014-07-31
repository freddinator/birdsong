# -*- encoding: utf8 -*-
from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
import sys
import json

ckey = 'XXXXX'
csecret = 'XXXXX'
atoken = 'XXXXX'
asecret = 'XXXXX'


class listener(StreamListener):

    def on_data(self, data):
        tweet = json.loads(data)
        if tweet['lang'] == 'en' and tweet['text'][:1] != '@' and tweet['geo'] is not None:
            tweets = open("/var/www/html/tweets.json", "a")	
            tweets.write(data)
            tweets.close()
            print "Data written"
        else:
        	print "Not written! Lang is " + tweet['lang'].encode('utf-8') + ' and first char is ' + tweet['text'][:1].encode('utf-8')
        return True

    def on_error(self, status):
        print status

auth = OAuthHandler(ckey, csecret)
auth.set_access_token(atoken, asecret)
twitterStream = Stream(auth, listener())

#Set your bounding box here:
twitterStream.filter(track=["-rt"],locations=[-6.240234,49.90595685515878,1.494141,59.193937])
