from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
from .scraper import scrape_website
from .screenshot import take_screenshot
import socket


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/scrape")
async def scrape(url: str):
    return await scrape_website(url)


@app.get("/screenshot")
async def screenshot(url: str, background_tasks: BackgroundTasks):
    return await take_screenshot(url, background_tasks)

@app.get("/")
def health_check():
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    return {
                "message": "Service is healthy.",
                "service:": "content-inspection",
                "ip_address": local_ip
            }
