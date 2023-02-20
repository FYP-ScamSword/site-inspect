from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
from .scrape.scraper import scrape_website
from .screenshot import take_screenshot

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
