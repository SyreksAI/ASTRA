from fastapi import FastAPI

app = FastAPI(title="Astra API", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Hello World from Astra!"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}