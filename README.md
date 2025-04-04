# MIDlet API

An express api for [MIDlet Store](https://github.com/Subhi-Dev/MIDlet-Store).  
A modern API for serving Java ME MIDlet applications to legacy devices. This API enables discovery, download, and community interaction for Java ME applications.

## Overview

MIDlet Store API is a backend service that allows Java ME devices to:
- Register device capabilities
- Browse available applications
- Search for specific apps
- View top-rated applications
- Download compatible MIDlets
- Vote on applications

The API is designed to work with limited capabilities of Java ME devices by using CSV responses that are easily parsed by legacy devices.

## Features

- **Device Registration**: Register devices with their supported APIs
- **App Listings**: Browse all available applications
- **App Details**: View detailed information about specific applications
- **Search**: Find applications by name
- **Top Charts**: View most popular applications
- **Voting System**: Upvote or downvote applications
- **Compatibility Checking**: Determine application compatibility with specific devices

## API Endpoints

| Endpoint             | Method | Description                               |
| -------------------- | ------ | ----------------------------------------- |
| `/storeapi/version`  | GET    | Get API version                           |
| `/storeapi/register` | GET    | Register a device with its supported APIs |
| `/storeapi/apps`     | GET    | List all available applications           |
| `/storeapi/apps/:id` | GET    | Get details for a specific application    |
| `/storeapi/search`   | GET    | Search for applications by name           |
| `/storeapi/topchart` | GET    | Get top-rated applications                |
| `/storeapi/vote`     | POST   | Vote for an application                   |
| `/storeapi/download` | GET    | Download application binary               |

## API Response Format

Most endpoints return data in CSV format for easy parsing on limited Java ME devices:

```
id,name,description,smallIconUrl,downloadUrl,isFeatured,supportStatus,votes
1,Snake,Classic snake game,http://example.com/icons/snake.png,http://example.com/apps/snake.jar,true,fully_supported,42
```

## Compatibility Status

Applications report compatibility with devices in three states:

- `fully_supported`: The device supports all APIs used by the application
- `partially_supported`: The device supports the minimum required APIs but not all
- `not_supported`: The device does not support the minimum required APIs
- `unknown`: Compatibility could not be determined

## Database Schema

The API uses a SQLite database with Drizzle ORM. The main tables include:

- `devices`: Registered devices and their identifiers
- `apps`: Application metadata and download information
- `apis`: Available APIs that can be supported by devices
- `devices_apis`: Maps which APIs are supported by which devices
- `categories`: Application categories
- `developers`: Application developers
- `screenshots`: Application screenshots
- `votes`: User votes on applications

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/YourUsername/MIDlet-Store-API.git
   cd MIDlet-Store-API
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file:

   ```
   PORT=3000
   DB_FILE_NAME=file:./local.db
   ```

4. Initialize and seed the database:

   ```
   npm run db:push
   npm run db:seed
   ```

5. Start the server:
   ```
   npm run dev
   ```

## Technologies Used

- Node.js and Express.js for the API server
- Drizzle ORM for database operations
- LibSQL/SQLite for the database
- TypeScript for type-safe code

## Client Integration

To integrate the MIDlet Store with a Java ME client:

1. Make HTTP requests to the API endpoints
2. Parse CSV responses
3. Display results to users
4. Handle downloads and installation

Example Java ME code for parsing CSV responses is available in the client repository.

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
