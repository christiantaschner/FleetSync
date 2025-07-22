# FleetSync AI

This is a Next.js application built with Firebase Studio.

## Getting Started

Before you run the application, you need to configure your environment variables.

1.  **Create a `.env.local` file** in the root of your project. This file is for your local environment variables and will not be committed to version control.

2.  **Set up Local Authentication (VERY IMPORTANT)**: For server-side operations to work locally, you must provide Google Application Default Credentials.
    *   Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
    *   Run `gcloud auth application-default login` in your terminal and follow the prompts to log in with the Google account that has access to your Firebase project. This command creates a credentials file on your machine that the Firebase Admin SDK will automatically find.

3.  **Populate `.env.local`**: Copy the block below into your `.env.local` file and replace the placeholder values with your actual credentials.

    ```
    # Firebase Client Configuration (for browser)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
    
    # Google Maps Configuration
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

    # Genkit AI (Gemini) Configuration - This is used by the client for some operations
    # No longer needed server-side, which will use Application Default Credentials.
    # Keep it for any potential client-side AI calls.
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"
    
    # Stripe Configuration
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"
    STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
    STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"
    
    # Find this on your product's pricing page in the Stripe Dashboard. It looks like `price_...`
    NEXT_PUBLIC_STRIPE_PRICE_ID="price_1RnhXgP8F2lL122i4lP6Zi98"

    # App URL (important for Stripe redirects)
    NEXT_PUBLIC_APP_URL="http://localhost:9002"

    # Mock Data (for testing)
    # Set to "true" to use static mock data instead of Firestore.
    # Note: When true, write operations will not be reflected in the UI.
    NEXT_PUBLIC_USE_MOCK_DATA="false"
    ```

4.  **Run the development server**:

    ```bash
    npm run dev
    ```

This will start the app on `http://localhost:9002`. Your environment variables from `.env.local` will now be available to the application.

## Required Google Cloud APIs

For the application to function correctly, you must enable the following APIs in your Google Cloud Console for the project associated with your Firebase configuration.

### Firebase

These APIs are typically enabled when you create your Firebase project but are essential for core functionality.

-   **Identity Platform API**: For Firebase Authentication (user login/signup).
-   **Cloud Firestore API**: For the main application database.
-   **Cloud Storage for Firebase API**: For storing user-uploaded files like photos and signatures.

### Google Maps Platform

These APIs are crucial for all mapping, location, and distance features.

-   **Maps JavaScript API**: Displays the interactive maps in the dashboard.
-   **Places API**: Powers the address autocomplete feature in forms.
-   **Geocoding API**: Converts street addresses into latitude/longitude coordinates for map markers.
-   **Distance Matrix API**: Used by the AI to calculate realistic travel times and distances for route optimization and risk prediction.

### Google AI

This API powers all generative AI features in the application through Genkit.

-   **Vertex AI API**: Enables access to Google's Gemini family of models for all AI-driven suggestions, analysis, and content generation.

You can enable these APIs by navigating to the "APIs & Services" > "Library" section of your Google Cloud Console, searching for each API by name, and clicking "Enable".
