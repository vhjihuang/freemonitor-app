const bcrypt = require('bcrypt');

bcrypt.hash('123456', 10, (err, hash) => {
  if (err) throw err;
  console.log('✅ Real hash for "123456":');
  console.log(hash);
})