// given a clear text password as the first cli argument, create a hash with bcrypt
// and print it to the console

const bcrypt = require('bcryptjs');

const password = process.argv[2];

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
  } else {
    console.log(hash);
  }
});
