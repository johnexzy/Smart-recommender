# Building an Intelligent Recommendation System: Leveraging Node.js, PGVector, and Google Gemini for Personalized Content Discovery

This project provides a service to embed text using Google's Generative AI and store the embeddings in a PostgreSQL database. It also includes functionality to find similar embeddings and recommend content based on user preferences.

## Prerequisites

- Node.js
- PostgreSQL
- Google Generative AI API Key

## Setup

1. **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    API_KEY=your_google_generative_ai_api_key
    DATABASE_URL=your_postgresql_database_url
    ACCESS_TOKEN_SECRET=your_jwt_secret
    ```

4. **Setup the database:**
    ```sh
    npx ts-node src/setupDatabase.ts
    ```

## Running the Service

1. **Start the server:**
    ```sh
    npx ts-node src/index.ts
    ```

2. The server will run on `http://localhost:9000`.

## API Endpoints

### User Management

#### Create User

- **URL:** `/user`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "name": "username",
        "password": "userpassword",
        "preferences": { /* user preferences */ }
    }
    ```
- **Response:**
    ```json
    {
        "userId": "generated_user_id",
        "name": "username",
        "preferences": { /* user preferences */ }
    }
    ```

#### User Login

- **URL:** `/login`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "username": "username",
        "password": "userpassword"
    }
    ```
- **Response:**
    ```json
    {
        "accessToken": "jwt_access_token"
    }
    ```

### Embedding and Similarity

#### Embed Text

- **URL:** `/embed`
- **Method:** `POST`
- **Headers:**
    ```json
    {
        "Authorization": "Bearer jwt_access_token"
    }
    ```
- **Body:**
    ```json
    {
        "text": "Your text to embed"
    }
    ```
- **Response:**
    ```json
    {
        "userId": "user_id",
        "text": "Your text to embed",
        "embedding": [/* embedding vector */]
    }
    ```

#### Find Similar Embeddings

- **URL:** `/similarity`
- **Method:** `POST`
- **Headers:**
    ```json
    {
        "Authorization": "Bearer jwt_access_token"
    }
    ```
- **Body:**
    ```json
    {
        "text": "Your text to find similarity"
    }
    ```
- **Response:**
    ```json
    [
        {
            "text": "Similar text",
            "vector": [/* embedding vector */],
            "distance": 0.123
        },
        // more results
    ]
    ```

### Recommendations

#### Recommend Similar Texts

- **URL:** `/recommend`
- **Method:** `POST`
- **Headers:**
    ```json
    {
        "Authorization": "Bearer jwt_access_token"
    }
    ```
- **Body:**
    ```json
    {
        "text": "Your text to get recommendations"
    }
    ```
- **Response:**
    ```json
    [
        {
            "text": "Recommended text",
            "similarity": 0.877
        },
        // more recommendations
    ]
    ```

## License

This project is licensed under the MIT License.
