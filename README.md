# To see demo of the application refer the video

  ```https://www.loom.com/share/f619cdcf27a842a7b2e2b56a58b4e896```


# How to run the backend and frontend?
1. Run the docker-compose.yml file. Make sure that docker desktop is up and running.

    ```docker compose up -d```

2. To run the server folder

    ```cd server/```

    ```npm i```

    ```npm run dev```

3. To run the client folder

    ```cd client/```

    ```npm i```
    
    ```npm run dev```

# Required environment variables
### For embeddings / LLM
```OPENAI_API_KEY=sk-...```

### Frontend -> backend base url
```NEXT_PUBLIC_API_BASE_URL=http://localhost:8000```

### Clerk authentication (optional but required if using Clerk)
```NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...```

```CLERK_SECRET_KEY=sk_...```



# RAG Logic (project-specific flow)

![RAG Flowchart Image](./client/public/RAG%20flowchat.png)
Note: Ignore the Postgre Logo. Instead it is qdrant DB.

1. Authentication (Clerk)
- Every user must sign in via Clerk. Clerk provides the authentication layer so only authorized users can upload and query documents.

2. Upload endpoint
- Frontend uploads PDFs to the backend via `POST /upload`.
- Backend saves each uploaded file to `./uploads/<filename>` and returns a `document_id`.

3. Enqueue for background processing
- After storing the file, the backend publishes a job to the queue (e.g., BullMQ). The job payload contains file metadata and `document_id`.

4. Node.js worker (consumer)
- A separate Node.js worker consumes jobs from the queue.
- Worker reads `./uploads/<filename>` and uses LangChain PDF/text loaders + a text splitter to break the document into multiple chunks (configurable chunk size + overlap).

5. Chunk → embeddings (OpenAI)
- For every chunk the worker calls the OpenAI Embeddings API to convert the chunk text into a numerical vector.

6. Persist vectors into Qdrant
- The worker stores each chunk’s embedding and metadata (document_id, chunk_index, page, original text, etc.) into Qdrant (vector DB) under a named collection.

7. User question → embedding
- When a user asks a question, the backend converts the user query into an embedding using the same OpenAI embeddings model.

8. Similarity search (retrieval)
- The backend queries Qdrant with the question embedding (cosine / dot similarity) and retrieves the top-k most similar chunk embeddings and their text. These are the retrieved context.

9. LLM call with retrieved context
- The backend composes a prompt/system message that includes:
  - A short system instruction (assistant role + constraints)
  - The concatenated retrieved context (clearly labeled)
  - The user’s original question
- The backend calls the LLM (OpenAI Chat Completion / GPT) with this prompt.

10. Response → render
- The LLM returns the answer. Backend responds to the frontend with:
```
  {
    "answer": "<LLM-generated answer>",
    "context": [
      { "chunk_text": "...", "score": 0.98,"metadata": { ... } },
      ...
    ]
  }
```
- Frontend renders the `answer` and optionally shows the `context` references (page numbers / chunk links).

Why this works
- Chunking keeps context windows small and focused.
- Embeddings + Qdrant let us efficiently retrieve highly relevant text.
- Giving the LLM only the retrieved context (not the whole doc) reduces hallucination and speeds up inference.
- Queue + worker decouples ingestion from user queries so ingestion is asynchronous and scalable.

