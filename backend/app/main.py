from fastapi import FastAPI

app = FastAPI()

@app.get("/api/post")
def get_posts_add():
    pass