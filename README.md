<!-- PROJECT LOGO -->
<!-- <h1 align="center">
  <a href="{project-url}">
    <img src="{project-logo}" alt="Logo" width="125" height="125">
  </a>
</h1> -->

<!-- TITLE -->

# Link inspection

<!-- TABLE OF CONTENTS -->
<!-- ## Table of contents

- [Project name](#project-name)
  - [Table of contents](#table-of-contents)
  - [About](#about)
    - [Built With](#built-with)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Usage](#usage)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [License](#license) -->

<!-- ABOUT -->
## About

A full-stack web application which inspects facilitates the process of inspecting suspicious links and sending takedown requests to the relevant DNS providers. This tool is intended to help with proactive scam prevention and response.

For more information on DNS registrars and takedown methods, refer to our [research document](./RESEARCH.md)

### Built With

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- Node (v16 preferred)
- Docker (optional for self-building)

### Usage

To run the app locally:

To build and run as a docker container:

1. What you need:

- GOOGLE_API_KEY:
  - Go to https://console.cloud.google.com, signup for an account (if you don't have one)
  - Create a project, then go to https://console.cloud.google.com/apis/credentials and select the project
  - Click on "Create Credentials", "API Key", and copy the API key.

- BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY:
  - Check out "To get your access key ID and secret access key" in https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html
  - Go to S3 and create a bucket. The bucket's name will be BUCKET.

2. Create .env file in ./url-inspection
```
GOOGLE_API_KEY=<Your google API key>
DBCONN=mongodb://mongodb:27017/link_inspection
AWS_ACCESS_KEY_ID=<your AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<your AWS_SECRET_ACCESS_KEY>
BUCKET="<s3 bucket name>"
```
3. Run the following command in the root folder.

`docker-compose up -d --build`

<!-- ROADMAP -->

## Roadmap

<!-- CONTRIBUTING -->

## Contributing

<!-- LICENSE -->

## License

See [LICENSE.md](./LICENSE.md)
