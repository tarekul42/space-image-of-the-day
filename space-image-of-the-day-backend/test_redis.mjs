import { createClient } from 'redis';

const url1 = "redis://default:e0zG8MIfGitqazoRGxub6YkrQXVI0ldg@redis-12680.crce217.ap-south-1-1.ec2.cloud.redislabs.com:12680";
const url2 = "rediss://default:e0zG8MIfGitqazoRGxub6YkrQXVI0ldg@redis-12680.crce217.ap-south-1-1.ec2.cloud.redislabs.com:12680";

async function testConnection(url) {
  console.log(`Testing: ${url}`);
  const client = createClient({ url });
  
  client.on('error', (err) => console.log('Redis Client Error', err.message));

  try {
    await client.connect();
    console.log('Connected successfully!');
    await client.disconnect();
  } catch (err) {
    console.log('Exception caught:', err.message);
  }
}

async function main() {
  await testConnection(url1);
  console.log('---');
  await testConnection(url2);
}

main();
