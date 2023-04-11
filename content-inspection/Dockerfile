FROM oraclelinux:8
WORKDIR /app

RUN yum install wget -y && yum install unzip -y

RUN wget https://chromedriver.storage.googleapis.com/2.37/chromedriver_linux64.zip

RUN unzip chromedriver_linux64.zip

RUN mv chromedriver /usr/bin/chromedriver

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

RUN yum install google-chrome-stable_current_x86_64.rpm -y

RUN curl -O https://bootstrap.pypa.io/get-pip.py

RUN dnf module install python39 -y

COPY requirements.txt /app

RUN python3 -m pip install --upgrade pip

RUN python3 -m pip install -r requirements.txt

COPY . /app

CMD ["uvicorn", "src.main:app", "--reload", "--port", "5001", "--host", "0.0.0.0"]
