from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import user, files
import uvicorn

app = FastAPI(title="Secure File Sharing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Decentralized Secure File Sharing API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
