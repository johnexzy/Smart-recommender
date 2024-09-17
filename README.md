# Generative AI Embedding Service

This project provides a service to embed text using Google's Generative AI and store the embeddings in a PostgreSQL database. It also includes functionality to find similar embeddings.

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

### Embed Text

- **URL:** `/embed`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "text": "Your text to embed"
    }
    ```
- **Response:**
    ```json
    {
        "text": "Your text to embed",
        "embedding": [/* embedding vector */]
    }
    ```

### Find Similar Embeddings

- **URL:** `/similarity`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "vector": [/* embedding vector */]
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

## License

This project is licensed under the MIT License.
