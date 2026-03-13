import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { initDB } from '../src/lib/db';
import { apiRouter } from './api';
import { setupSocketHandlers } from './socket';
import { refreshLeaderboard } from './game';

dotenv.config();

async function startServer() {
  console.log("Server is starting...");
  await initDB();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // API Routes
  app.use('/api', apiRouter);

  app.get(["/auth/twitch/callback", "/auth/twitch/callback/"], async (req, res) => {
    const { code, state } = req.query;
    console.log("Twitch callback received. Code:", code, "State:", state);
    try {
      const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.TWITCH_CLIENT_ID || "",
          client_secret: process.env.TWITCH_CLIENT_SECRET || "",
          code: code as string,
          grant_type: "authorization_code",
          redirect_uri: state as string,
        }),
      });
      const tokenData = await tokenResponse.json();
      console.log("Token exchange response:", tokenData);
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }
      
      const userResponse = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID || "",
        },
      });
      const userData = await userResponse.json();
      console.log("User data response:", userData);
      if (!userResponse.ok) {
        throw new Error(`User fetch failed: ${JSON.stringify(userData)}`);
      }
      
      const user = userData.data[0];
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Twitch auth error:", error);
      res.status(500).send(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Socket.IO
  setupSocketHandlers(io);

  // Initial load
  await refreshLeaderboard(io);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
