export type TwitchMessage = {
  username: string;
  color: string;
  text: string;
};

export class TwitchChat {
  private ws: WebSocket | null = null;
  private channel: string;
  private onMessage: (msg: TwitchMessage) => void;
  private onConnect: () => void;
  private onDisconnect: () => void;
  private reconnectTimer: any = null;

  constructor(
    channel: string,
    onMessage: (msg: TwitchMessage) => void,
    onConnect: () => void,
    onDisconnect: () => void
  ) {
    this.channel = channel.toLowerCase().replace('#', '');
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    this.ws.onopen = () => {
      this.ws?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      this.ws?.send('PASS SCHMOOPIIE');
      this.ws?.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
      this.ws?.send(`JOIN #${this.channel}`);
      this.onConnect();
    };

    this.ws.onmessage = (event) => {
      const lines = event.data.split('\r\n');
      for (const line of lines) {
        if (!line) continue;

        if (line.startsWith('PING')) {
          this.ws?.send('PONG :tmi.twitch.tv');
        } else if (line.includes('PRIVMSG')) {
          this.parseMessage(line);
        }
      }
    };

    this.ws.onclose = () => {
      this.onDisconnect();
      // Auto-reconnect
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 5000);
    };

    this.ws.onerror = (err) => {
      console.error('Twitch WS Error:', err);
      this.ws?.close();
    };
  }

  private parseMessage(line: string) {
    try {
      // Example line: @badge-info=;badges=broadcaster/1;color=#FF0000;display-name=StreamerName;emotes=;flags=;id=...;mod=0;room-id=...;subscriber=0;tmi-sent-ts=...;turbo=0;user-id=...;user-type= :streamername!streamername@streamername.tmi.twitch.tv PRIVMSG #streamername :Hello World!
      const tagsPart = line.split(' ')[0];
      
      const displayNameMatch = tagsPart.match(/display-name=([^;]+)/);
      const colorMatch = tagsPart.match(/color=([^;]+)/);
      
      // Extract the message text
      const msgIndex = line.indexOf(' PRIVMSG ');
      if (msgIndex === -1) return;
      
      const textPart = line.substring(msgIndex);
      const colonIndex = textPart.indexOf(' :');
      if (colonIndex === -1) return;
      
      const text = textPart.substring(colonIndex + 2);
      
      // Fallback to username if display-name is empty
      let username = displayNameMatch ? displayNameMatch[1] : 'Unknown';
      if (!username) {
        const userMatch = line.match(/:([^!]+)!/);
        username = userMatch ? userMatch[1] : 'Unknown';
      }

      this.onMessage({
        username,
        color: (colorMatch && colorMatch[1]) ? colorMatch[1] : '#9146FF', // Default Twitch Purple
        text: text.trim(),
      });
    } catch (e) {
      console.error('Failed to parse Twitch message:', e, line);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
      this.onDisconnect();
    }
  }
}
