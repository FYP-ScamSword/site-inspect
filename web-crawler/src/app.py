from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup, SoupStrainer
import httplib2

app = Flask(__name__)

CORS(app)


@app.route("/", methods=['GET'])
def crawl_web():
    args = request.args
    url = args.get("url")
    if url is None:
        return jsonify({"message": "url not provided"}), 400

    http = httplib2.Http()
    status, response = http.request(url)

    links = set(url)
    for link in BeautifulSoup(response, parse_only=SoupStrainer('a')):
        if link.has_attr('href'):
            links.add(link['href'])
    soup = BeautifulSoup(response, 'html.parser')

    return jsonify(soup.prettify()), 200


def typosquatting():
    return


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
