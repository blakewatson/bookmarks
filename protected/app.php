<?php
  
require_once('vendor/autoload.php');

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

function auth() {
  $hash = $_ENV['TOKEN_HASH'];
  $clear = $_SERVER['HTTP_BW_TOKEN'];
  $success = password_verify($clear, $hash);

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

function get_archive() {
  error_log(file_get_contents(__DIR__ . '/data/archives.json'));
  return trim(explode('\n', file_get_contents(__DIR__ . '/data/archives.json'))[0]);
}

function archive($url) {
  $request_url = 'https://web.archive.org/save';

  $access_key = $_ENV['S3_ACCESS_KEY'];
  $secret_key = $_ENV['S3_SECRET_KEY'];
  $key = "$access_key:$secret_key";
  
  var_dump($key);
  var_dump($url);

  $curl = curl_init($request_url);
  curl_setopt($curl, CURLOPT_POST, true);
  curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Accept: application/json",
    "Authorization: LOW $key",
  ]);
  curl_setopt($curl, CURLOPT_POSTFIELDS, "url=$url&skip_first_archive=1");
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

  return curl_exec($curl);
}
  
function check_status_and_save_link($job_id, $bookmark_id) {
  $sanity = 24;
    
  while (true && $sanity) {
    sleep(5);
    $response = file_get_contents("http://web.archive.org/save/status/{$job_id}");
    $data = json_decode($response, true);
    $archives = file_get_contents(__DIR__ . '/data/archives.json');
    
    if ($data['status'] == 'success') {
      $archive_id = "{$data['timestamp']}/{$data['original_url']}";
      $archive_url = "https://web.archive.org/web/$archive_id";
      $archives = json_decode($archives, true);

      array_push($archives, [
        'archive_id' => $archive_id,
        'bookmark_id' => $bookmark_id,
        'archive_url' => $archive_url
      ]);

      file_put_contents(__DIR__ . '/data/archives.json', json_encode($archives, JSON_UNESCAPED_SLASHES));
      break;
    } else if ($data['status'] == 'error') {
      array_push($archives, [
        'bookmark_id' => $bookmark_id,
        'error' => $data
      ]);
      break;
    }
    
    $sanity--;
  }
}
  
function get_archival_link($url, $bookmark_id) {
  $capture_result = archive($url);
  
  if (!$capture_result) {
    return;
  }
  
  $id = json_decode($capture_result, true)['job_id'];
  
  check_status_and_save_link($id, $bookmark_id);
}
