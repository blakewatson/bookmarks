const fetch = require('node-fetch');

const WAYBACK_URL = 'https://web.archive.org';
const CAPTURE_URL = `${WAYBACK_URL}/save`;
const STATUS_URL = `${CAPTURE_URL}/status`;
const SNAPSHOT_URL = `${WAYBACK_URL}/web`;

const archiveUrl = async (url) => {
  try {
    const captureResp = await waybackCaptureRequest(url);
    const data = await captureResp.json();
    const jobId = data.job_id;

    const result = await tryJobStatus(jobId);

    if (result.status === 'success') {
      const archiveId = `${result.timestamp}/${result.original_url}`;

      return {
        archive_id: archiveId,
        archive_url: `${SNAPSHOT_URL}/${archiveId}`
      };
    }

    if (result.status === 'error') {
      return {
        error: result
      };
    }

    return false; // ¯\_(ツ)_/¯
  } catch (err) {
    console.error(err);
    return false;
  }
};

const waybackCaptureRequest = async (url) => {
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const key = `${accessKey}:${secretKey}`;

  return fetch(CAPTURE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `LOW ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `url=${url}&skip_first_archive=1`
  });
};

const checkJobStatus = async (jobId) => {
  const resp = await fetch(`${STATUS_URL}/${jobId}`);
  return await resp.json();
};

// repeatedly check capture job status and return result when completed
const tryJobStatus = (jobId) => {
  return new Promise(async (resolve, reject) => {
    const delay = 10000;
    let tries = 20;

    const checker = async () => {
      const resp = await checkJobStatus(jobId);

      if (resp.status === 'pending') {
        tries--;

        if (!tries) {
          reject('Capture took too long to complete.');
          return;
        }

        timer = setTimeout(checker, delay);
        return;
      }

      resolve(resp); // could be an error
    };

    let timer = setTimeout(checker, delay);
  });
};

module.exports = {
  archiveUrl,
  waybackCaptureRequest,
  checkJobStatus,
  tryJobStatus
};
