FROM python:3.9-slim
WORKDIR /app

# RUN apt-get update \
#     && apt-get install -y curl unzip \
#     && curl -sSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb > google-chrome-stable_current_amd64.deb \
#     && apt install -y ./google-chrome-stable_current_amd64.deb \
#     && rm google-chrome-stable_current_amd64.deb
# RUN apt-get update \
#   && apt-get install -y curl unzip gnupg gnupg2  gnupg1
# RUN curl -sSL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
# RUN echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/google.list
# RUN apt-get update && apt-get install -y google-chrome-stable
# RUN wget https://chromedriver.storage.googleapis.com/2.46/chromedriver_linux64.zip && \
#   unzip chromedriver_linux64.zip && \
#   mv chromedriver /usr/local/bin/ && \
#   chmod +x /usr/local/bin/chromedriver && \
#   rm chromedriver_linux64.zip

# ENV CHROME_BINARY_LOCATION=/usr/bin/google-chrome-stable
# ENV PATH="/usr/bin/google-chrome-stable:${PATH}"
# ENV CHROMEDRIVER_BINARY_LOCATION=/usr/local/bin/chromedriver
COPY requirements.txt /app

RUN pip install -r requirements.txt

COPY . /app

CMD ["uvicorn", "src.main:app", "--reload", "--port", "5001"]
