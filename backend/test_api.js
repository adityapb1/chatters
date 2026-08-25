async function main() {
  const loginRes = await fetch('http://localhost:5005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pihu', password: 'password123' })
  });
  console.log("Login pihu status:", loginRes.status);
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log("Cookie:", cookie);
  
  const meRes = await fetch('http://localhost:5005/api/auth/me', { headers: { Cookie: cookie } });
  const meData = await meRes.json();
  console.log("Auth me:", meData.user.username);
  
  const convsRes = await fetch('http://localhost:5005/api/conversations', { headers: { Cookie: cookie } });
  const convsData = await convsRes.json();
  console.log("Conversations:", JSON.stringify(convsData, null, 2));
}

main().catch(console.error);
