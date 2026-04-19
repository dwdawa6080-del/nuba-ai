const dns = require('dns');
console.log('dns servers before:', dns.getServers());
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
console.log('dns servers after:', dns.getServers());
dns.resolveSrv('_mongodb._tcp.cluster0.j9mfjeh.mongodb.net', (err, records) => {
  if (err) {
    console.error('ERR', err);
    process.exit(1);
  }
  console.log(records);
  process.exit(0);
});
