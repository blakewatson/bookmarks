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
}