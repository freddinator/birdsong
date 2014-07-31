<?php
$badwords = array();
$censor = true;
include 'lang/en-uk.wordlist-regex.php';
include 'lang/en-us.wordlist-regex.php';
include 'lang/en.wordlist-regex.php';
include 'censor.function.php';
require 'vendor/autoload.php';

$file = "tweets.json";

$file = escapeshellarg($file); // for the security concious (should be everyone!)
$json = `tail -n 11 $file`;

$jsona = explode("\n", $json);

$json = $jsona[0] . ',' . $jsona[1] . ',' . $jsona[2] . ',' . $jsona[3] . ',' . $jsona[4] . ',' . $jsona[5] . ',' . $jsona[6] . ',' . $jsona[7] . ',' . $jsona[8] . ',' . $jsona[9];

$json = str_replace("@", "&#64", $json);


if (substr($json, -1) == ' ') {
	$json = substr($json, 0, -1);
}

if (substr($json, -3 == ',')) {

}


$json = '{"statuses":[' . $json . ']}';


$array= json_decode($json,true);

$transmission_array = array();

foreach ($array['statuses'] as $tweet) {
	$response = Unirest::post("https://japerk-text-processing.p.mashape.com/sentiment/",
	  array(
	    "X-Mashape-Key" => "GET THIS FROM http://www.mashape.com/japerk/text-processing"
	  ),
	  array(
	    "language" => "english",
	    "text" => $tweet['text']
	  )
	);

	$mood = $response->body;


	$censoredtweet = censorString($tweet['text'], $badwords);

	if ($censor) {
		$censoredtweet = $censoredtweet['clean'];
	}

	$transmission_array[] = array('tweet' => $censoredtweet, 'id' => $tweet['id_str'], 'screen_name' => $tweet['user']['screen_name'], 'location' => $tweet['geo']['coordinates'], 'rt_count' => $tweet['retweet_count'], 'f_count' => $tweet['favorite_count'], 'mood' => $mood);
}
header('Content-type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode($transmission_array);

?>
