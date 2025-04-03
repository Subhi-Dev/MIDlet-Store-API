# MIDlet API

An express api for [Slack Client MIDlet](https://github.com/Subhi-Dev/SlackClientMIDlet), to serve as a middle man between the MIDlet and the Slack API.

## Features

- **Real-time Slack integration** - Connect to Slack channels and receive messages in real-time
- **TCP Socket Interface** - Subscribe to channels for real-time message streaming
- **RESTful API** - HTTP endpoints for retrieving channel messages and thread replies
- **Message Sending** - Send messages to Slack channels or threads via API
- **Custom Formatting** - Messages are formatted for easy parsing and integration

## Setup

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- Slack workspace with admin permissions
- Slack Bot Token and App Token

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
PORT=3000
SOCKET_PORT=3001
```

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Start production server
pnpm start
```

## Socket Interface

The server provides a TCP socket interface for real-time message subscriptions.

### Commands

- **Subscribe to a channel**: `//SUBSCRIBE <channelId>`
- **Unsubscribe from a channel**: `//UNSUBSCRIBE <channelId>`

### Message Format

Messages are delivered in the following pipe-delimited format:

```
<thread_timestamp>|<username>|<time>|<message_text>
```

Example:

```
1643382761.000400|john.doe|14:32|Hello world!
```

## API Endpoints

### Health Check

```
GET /health
```

Returns the status of the server.

### Channel Messages

```
GET /messages/:channelId
```

Retrieves the 20 most recent messages from a specific Slack channel in CSV format.

### Thread Messages

```
GET /messages/:channelId/thread/:threadTs
```

Retrieves all replies in a specific thread in CSV format.

### Send Message

```
GET /messages/send/:channelId?message=<your-message>&thread_ts=<optional-thread-ts>
```

Sends a message to a Slack channel or thread.

Parameters:

- `message`: The text message to send (required)
- `thread_ts`: Thread timestamp to reply to (optional)

