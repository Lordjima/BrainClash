import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    console.log('AuthCallback loaded');
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
      // Fetch user info
      fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': '47anvp07hr6dfxl1ucsscnjavs5j2e'
        }
      })
      .then(res => res.json())
      .then(data => {
        const user = data.data[0];
        if (window.opener) {
          window.opener.postMessage({ type: 'TWITCH_AUTH_SUCCESS', user }, '*');
          window.close();
        }
      })
      .catch(err => {
        console.error('Error fetching Twitch user:', err);
        window.close();
      });
    } else {
      window.close();
    }
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
      <p className="font-black uppercase tracking-widest">Connexion en cours...</p>
    </div>
  );
}
