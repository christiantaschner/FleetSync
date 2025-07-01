# FleetSync AI

This is a Next.js application built with Firebase Studio.

## Getting Started

Before you run the application, you need to configure your environment variables.

1.  **Create a `.env.local` file** in the root of your project. This file is for your local environment variables and will not be committed to version control.

2.  **Add your credentials** to the `.env.local` file. Copy and paste the block below and replace the placeholder values with your actual credentials.

    ```
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"
    
    # Google Maps Configuration
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

    # Genkit AI (Gemini) Configuration
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"
    
    # Stripe Configuration
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"
    STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
    STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"
    
    # Stripe Price IDs (Find these in your Stripe Dashboard under Product > Pricing)
    # Example: NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="price_1P..."
    NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="YOUR_STARTER_PLAN_PRICE_ID"
    NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="YOUR_PRO_PLAN_PRICE_ID"
    # For enterprise plans, you might link to a contact page instead.
    NEXT_PUBLIC_STRIPE_ENTERPRISE_CONTACT_URL="YOUR_CONTACT_US_PAGE_OR_LINK"


    # App URL
    NEXT_PUBLIC_APP_URL="http://localhost:9002"
    ```

3.  **Run the development server**:

    ```bash
    npm run dev
    ```

This will start the app on `http://localhost:9002`. Your environment variables from `.env.local` will now be available to the application.
