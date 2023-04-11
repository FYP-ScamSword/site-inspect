import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from sklearn.neighbors import NearestNeighbors
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


# Load VGG16
model = VGG16(weights='imagenet', include_top=False, input_shape=(32, 32, 3))

# Import favicons
def create_file_list():
    file_list = []
    objects_list = []

    bucket = os.environ.get("LEGIT_FAVICONS")
    result = s3.list_objects(Bucket = bucket)
    for o in result.get('Contents'):
        filename = o.get('Key')
        file_list.append(filename)
        data = s3.get_object(Bucket=bucket, Key=o.get('Key'))
        objects_list.append(data)
        #contents = data['Body'].read()
        #print(contents.decode("utf-8"))

    # for root, _, files in os.walk(dir, topdown=True):
    #     for name in files:
    #         fullname = os.path.join(root, name)
    #         file_list.append(fullname)
    #         names.append(name)
    return file_list, objects_list


# load the original image
#cwd = os.getcwd()
myFileList, objects = create_file_list()
print(myFileList)
print(objects)


def extract_features_for_k_cluster(img_path):
    img = tf.keras.preprocessing.image.load_img(img_path, target_size=(32, 32))
    x = tf.keras.preprocessing.image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    features = model.predict(x)
    features2 = np.reshape(features, (features.shape[0], -1))
    return features2


# Apply the Feature Extraction functions
# features = []
# for file in myFileList:
#     feature = extract_features_for_k_cluster(file)
#     features.append(feature)

# # K-clustering model for top 5
# def find_similar_images(query_img_features, k=5):
#     dataset_features = features
#     dataset_features = np.vstack(dataset_features)

#     # Find the k most similar images using the nearest neighbors algorithm
#     neighbors = NearestNeighbors(n_neighbors=k, metric='cosine')
#     neighbors.fit(dataset_features)
#     distances, indices = neighbors.kneighbors(query_img_features)
#     # Return the filenames of the most similar favicons
#     result = []
#     for i in range(k):
#         result.append({"name": names[indices[0][i]].split(
#             '.')[0], "distance": float(distances[0][i]), "url": os.environ.get("FAVICON_DATABASE")+})
#     return result
