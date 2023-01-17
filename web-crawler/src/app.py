from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from bs4 import BeautifulSoup, SoupStrainer
import httplib2
import time
from selenium import webdriver

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

@app.route("/screenshot", methods=["GET"])
def screenshot():
    args = request.args
    url = args.get("url")
    if url is None:
        return jsonify({"message": "url not provided"}), 400

    options = webdriver.ChromeOptions()
    options.headless = True
    driver = webdriver.Chrome(options=options)


    driver.get(url)

    S = lambda X: driver.execute_script('return document.body.parentNode.scroll'+X)
    driver.set_window_size(S('Width'),S('Height')) # May need manual adjustment                                                                                                                
    driver.save_screenshot('src/ss.png')

    driver.quit()
    return send_file('ss.png', mimetype='image/gif')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
