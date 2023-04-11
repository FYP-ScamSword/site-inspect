import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from sklearn.neighbors import NearestNeighbors
import boto3
from dotenv import load_dotenv

cwd = os.getcwd()

# Specify the path to the .env file relative to the current working directory
dotenv_path = os.path.join(cwd, '.env')
load_dotenv(dotenv_path)
# Load VGG16
model = VGG16(weights='imagenet', include_top=False, input_shape=(32, 32, 3))


def download_all_from_s3(bucket_name, local_directory_path):
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)

    for obj in bucket.objects.all():
        # construct local path
        local_path = os.path.join(local_directory_path, obj.key)

        # create directory if it doesn't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # download object
        bucket.download_file(obj.key, local_path)

        print(f"Downloaded {obj.key} to {local_path}")
# Import favicons


def create_file_list(dir):
    file_list = []
    names = []
    for root, _, files in os.walk(dir, topdown=True):
        for name in files:
            fullname = os.path.join(root, name)
            file_list.append(fullname)
            names.append(name)
    return file_list, names


# load the original image
cwd = os.getcwd()
download_all_from_s3(os.environ.get('FAVICON_BUCKET'), cwd+'/src/assets/data')
myFileList, names = create_file_list(cwd+'/src/assets/data')


def extract_features_for_k_cluster(img_path):
    img = tf.keras.preprocessing.image.load_img(img_path, target_size=(32, 32))
    x = tf.keras.preprocessing.image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    features = model.predict(x)
    features2 = np.reshape(features, (features.shape[0], -1))
    return features2


# Apply the Feature Extraction functions
features = []
for file in myFileList:
    feature2 = extract_features_for_k_cluster(file)
    features.append(feature2)

# K-clustering model for top 5


def find_similar_images(query_img_features, k=5):
    dataset_features = features
    dataset_features = np.vstack(dataset_features)

    # Find the k most similar images using the nearest neighbors algorithm
    neighbors = NearestNeighbors(n_neighbors=k, metric='cosine')
    neighbors.fit(dataset_features)
    distances, indices = neighbors.kneighbors(query_img_features)
    # Return the filenames of the most similar favicons
    result = []
    for i in range(k):
        result.append({"name": names[indices[0][i]].split(
            '.')[0], "distance": float(distances[0][i]), 
            "filename": names[indices[0][i]]})
    return result
