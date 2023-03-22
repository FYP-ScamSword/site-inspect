from http.client import HTTPException
import os
from typing import Dict
import urllib.parse
import requests
import boto3
from selenium import webdriver
from fastapi import BackgroundTasks
from dotenv import load_dotenv

cwd = os.getcwd()

# Specify the path to the .env file relative to the current working directory
dotenv_path = os.path.join(cwd, '.env')
load_dotenv(dotenv_path)
s3 = boto3.client('s3',
                  aws_access_key_id=os.environ.get("AWS_PUBLIC_KEY"),
                  aws_secret_access_key=os.environ.get("AWS_SECRET_KEY"),
                  region_name='us-east-1')


async def delete_file_from_local(filename: str) -> None:
    os.remove(filename)


async def take_screenshot(url: str, background_tasks: BackgroundTasks) -> Dict[str, str]:
    res = requests.get(url)
    if res.status_code != 200:
        raise HTTPException(res.status_code, {"message": "Invalid URL"})

    filename = urllib.parse.quote(url, safe='')+'.png'

    options = webdriver.ChromeOptions()
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--no-sandbox')
    options.add_argument('--headless')
    # driver = webdriver.Remote(command_executor="http://chrome:4444/wd/hub")
    driver = webdriver.Chrome(options=options)

    driver.get(url)

    def size(name): return driver.execute_script(
        'return document.body.parentNode.scroll'+name)
    # May need manual adjustment
    driver.set_window_size(size('Width'), size('Height'))
    driver.save_screenshot(filename)

    # Upload the screenshot to S3
    s3.upload_file(
        Filename=filename,
        Bucket="scamsword-screenshots",
        Key=filename,
    )

    # Schedule a background task to delete the file from local after it's uploaded to S3
    background_tasks.add_task(delete_file_from_local, filename)

    return {"filename": filename}
