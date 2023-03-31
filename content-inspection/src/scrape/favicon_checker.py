from urllib.parse import urlparse
from .image_similarity_checker import extract_features_for_k_cluster, find_similar_images
import requests
import io
from PIL import Image,ImageOps


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
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
        image = ImageOps.fit(image, (32, 32), method=Image.LANCZOS)

        # Save the PNG image to a file
        image_path = parsed_url.netloc + '.png'
        image.save(image_path)

        features = extract_features_for_k_cluster(image_path)
        similar_favicon = find_similar_images(features)
        print(similar_favicon)
    except (requests.exceptions.HTTPError, IOError) as e:
        print(e)

    return {"favicon_url": favicon_url, "similar_favicons": tuple(similar_favicon)}
