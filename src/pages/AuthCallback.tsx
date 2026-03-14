import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
      fetchUserInfo(accessToken);
    } else {
      console.error('No access token found in URL hash');
      navigate('/');
    }
  }, [navigate]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': '47anvp07hr6dfxl1ucsscnjavs5j2e' // Hardcoded for now or use env
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user info');
      
      const data = await response.json();
      const user = data.data[0];

      if (user) {
        // Send message to opener if it exists (for popup flow)
        if (window.opener) {
          window.opener.postMessage({ type: 'TWITCH_AUTH_SUCCESS', user }, window.location.origin);
          window.close();
        } else {
          // Fallback for redirect flow
          localStorage.setItem('twitch_user', JSON.stringify(user));
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Error fetching Twitch user info:', err);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">Connexion à Twitch en cours...</p>
      </div>
    </div>
  );
}
