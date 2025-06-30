# FleetSync AI

This is a Next.js application built with Firebase Studio.

## Getting Started

Before you run the application, you need to configure your environment variables.

1.  **Open `.env`**: Open the `.env` file in the root of your project.
2.  **Fill in your credentials**: Replace the placeholder values (e.g., `YOUR_API_KEY`, `YOUR_STRIPE_SECRET_KEY`) with your actual credentials for:
    *   Firebase
    *   Google Maps
    *   Stripe

You can find these keys in their respective project consoles. The `NEXT_PUBLIC_APP_URL` should be the URL where your app is running (e.g., http://localhost:9002 for local development).

Once your `.env` file is configured, you can run the development server:

```bash
npm run dev
```

This will start the app on `http://localhost:9002`.
