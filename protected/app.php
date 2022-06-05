<?php

function auth() {
  $hash = trim(explode('\n', file_get_contents(__DIR__ . '/data/pw.txt'))[0]);
  $token = $_SERVER['HTTP_BW_TOKEN'];
  $success = password_verify($token, $hash);

  if (!$success) {
    throw new Exception('Password verification failed');
    return false;
  }

  return true;
}

function read() {
  return trim(explode('\n', file_get_contents(__DIR__ . '/data/everything.json'))[0]);
}

function write($data) {
  return file_put_contents(__DIR__ . '/data/everything.json', $data);
}