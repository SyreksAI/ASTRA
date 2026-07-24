from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ASTRA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ASTRA API is running!"}

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "service": "backend"}

@app.get("/api/v1/users")
async def get_users():
    return {"users": ["Alice", "Bob", "Charlie", "Diana"]}

@app.get("/api/v1/hello")
async def hello():
    return {"message": "Hello from ASTRA!"}