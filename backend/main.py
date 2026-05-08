from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
import uvicorn


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

import time
from starlette.requests import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Only print for non-static requests to reduce console noise
    if request.url.path.startswith("/api"):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    return await call_next(request)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    allow_all = "*" in origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=not allow_all, # Credentials cannot be used with wildcard "*"
        allow_methods=["*"],
        allow_headers=["*"],
    )

from fastapi.staticfiles import StaticFiles
import os

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve Frontend Static Files
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

@app.get("/")
def root():
    return {"message": "Welcome to Aura Task Suite API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    from app.db.session import client
    import time
    start_time = time.time()
    try:
        # Ping database to check connectivity
        await client.admin.command('ping')
        latency = (time.time() - start_time) * 1000
        return {
            "status": "ok", 
            "message": "Server and Database are responsive",
            "db_latency_ms": round(latency, 2)
        }
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Database connection failed: {str(e)}"}
        )

import asyncio
import httpx

@app.on_event("startup")
async def startup_event():
    # Start a background task to ping itself every 10 minutes
    # This prevents Render from sleeping as long as the server is active
    async def keep_alive():
        client = httpx.AsyncClient()
        while True:
            await asyncio.sleep(600) # 10 minutes
            try:
                # Use localhost to ping itself internally
                await client.get("http://0.0.0.0:8000/health")
                # Also ping the external URL if possible (optional)
            except Exception:
                pass
    
    asyncio.create_task(keep_alive())

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
