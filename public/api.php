<?php

require __DIR__ . '/../protected/app.php';

function logger($var) {
  ob_start();
  var_dump($var);
  error_log(ob_get_clean());
}

if (! auth()) {
  throw new Exception('Access denied');
  die();
}

$body = file_get_contents('php://input');

if (key_exists('read', $_REQUEST)) {
  try {
    $data = read();
    http_response_code(200);
    echo $data;
  } catch (\Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
  }
} else if (key_exists('write', $_REQUEST) && $body) {
  $success = write($body);
  
  if ($success === false) {
    http_response_code(500);
    die();
  }

  http_response_code(201);
} else if (key_exists('get_archive', $_REQUEST)) {
  try {
    $data = get_archive();
    http_response_code(200);
    echo $data;
  } catch (\Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
  }
} else if (key_exists('archive', $_REQUEST) && $body) {
  $data = json_decode($body, true);
  
  try {
    get_archival_link($data['url'], $data['id']);
    http_response_code(200);
  } catch(\Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
  }
}