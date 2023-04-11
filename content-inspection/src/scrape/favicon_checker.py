from urllib.parse import urlparse
from .image_similarity_checker import extract_features_for_k_cluster, find_similar_images
import requests
import io
from PIL import Image
import os
import boto3
from dotenv import load_dotenv

cwd = os.getcwd()

# Specify the path to the .env file relative to the current working directory
dotenv_path = os.path.join(cwd, '.env')
load_dotenv(dotenv_path)
s3 = boto3.client('s3',
                  aws_access_key_id=os.environ.get("AWS_PUBLIC_KEY"),
                  aws_secret_access_key=os.environ.get("AWS_SECRET_KEY"),
                  region_name='us-east-1')


def favicon_checker(url: str) -> dict:
    parsed_url = urlparse(url)
    favicon_url = parsed_url.scheme + "://" + parsed_url.netloc + "/favicon.ico"
    similar_favicon = []

    print(favicon_url)

    try:
        # Download the favicon.ico file
        response = requests.get(favicon_url)
        response.raise_for_status()

        # Convert the favicon.ico file to a 32x32 PNG image
        image = Image.open(io.BytesIO(response.content))
        # .convert('RGB')
        # image = ImageOps.fit(image, (32, 32), method=Image.LANCZOS)

        # Save the PNG image to a file
        image_path = parsed_url.netloc + '.png'
        image.save(image_path)

        features = extract_features_for_k_cluster(image_path)
        similar_favicon = find_similar_images(features)

        # Upload the screenshot to S3
        s3.upload_file(
            Filename=image_path,
            Bucket=os.environ.get('SCRAPED_FAVICON_BUCKET'),
            Key=image_path,
        )
    except (requests.exceptions.HTTPError, IOError) as e:
        print(e)

    return {"favicon_url": favicon_url, "similar_favicons": tuple(similar_favicon)}
