import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`job:`, job.data);
    const data = JSON.parse(job.data);

    /*
  path: data.path,
  read the pdf from path,
  chunk the pdf,
  call the openai embedding model for every chunk,
  store the chunk in qdrant db
   */

    //   Load the pdf
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await splitter.splitDocuments(docs);

    const docsWithMetadata = chunkedDocs.map(
      (doc) =>
        new Document({
          pageContent: doc.pageContent,
          metadata: {
            ...(doc.metadata || {}),
            fileId: data.fileId,
            source: data.filename,
          },
        })
    );

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: "langchainjs-testing",
      }
    );

    await vectorStore.addDocuments(docsWithMetadata);
    console.log(`ALL DOCS WERE ADDED TO VECTOR STORE`)
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: "6379",
    },
  }
);
