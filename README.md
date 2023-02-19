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

For more information on the URL inspection feature, refer to our [url inspection document](./URLINSPECTION.md)

### Built With

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

- Node (v16 preferred)
- Docker (optional for self-building)
- MongoDB (optional for docker)
  - https://www.mongodb.com/docs/manual/installation/
- Mongo Tools (optional for docker)
  - https://www.mongodb.com/docs/database-tools/installation/installation/
- Environment Variables (`.env`)
  - `GOOGLE_API_KEY`:
    - Go to https://console.cloud.google.com, signup for an account (if you don't have one)
    - Create a project, then go to https://console.cloud.google.com/apis/credentials and select the project
    - Click on "Create Credentials", "API Key", and copy the API key.

  - `BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`:
    - Check out "To get your access key ID and secret access key" in https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html
    - Go to S3 and create a bucket. The bucket's name will be `BUCKET`.

### Usage

1. Create `.env` file in `./url-inspection`
```
GOOGLE_API_KEY=<Your google API key>
DBCONN=mongodb://mongodb:27017/link_inspection
AWS_ACCESS_KEY_ID=<your AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<your AWS_SECRET_ACCESS_KEY>
BUCKET="<s3 bucket name>"
```

---

**To run the app locally:**

2. Note that you will need `mongodb` and `mongo tools` as mentioned in the [prequisites](#prerequisites) section.

3. Run the following commands.

```
cd ./url-inspection
./import.sh
```

You will see the following output if it ran successfully:

```
2023-02-19T03:00:50.320+0800    connected to: mongodb://localhost:27017/link-inspection
2023-02-19T03:00:50.415+0800    10 document(s) imported successfully. 0 document(s) failed to import.
2023-02-19T03:00:50.513+0800    connected to: mongodb://localhost:27017/link-inspection
2023-02-19T03:00:50.603+0800    28 document(s) imported successfully. 0 document(s) failed to import.
MongoDB Import Completed
```

4. Start the application by running the following command.

```
node server.js
```

Unless you define `PORT` in the `.env` file, it will run on port `8080`.

5. Once the application is up and running, you can send a request to the API:

```
POST http://localhost:8080/api/linkinspect
{
    "inspectURL": "<url to inspect>"
}
```

If successful, you will see the following response:

```
{
    "message": "Link inspection request successful."
}
```

Log files/reports are uploaded to the S3 bucket defined in the `.env` file.

---

**To build and run as a docker container:**

2. Run the following command in the root folder.

`docker-compose up -d --build`

3. Once the container is up and running, you can send a request to the API:

```
POST http://localhost:30000/api/linkinspect
{
    "inspectURL": "<url to inspect>"
}
```

If successful, you will see the following response:

```
{
    "message": "Link inspection request successful."
}
```

Log files/reports are uploaded to the S3 bucket defined in the `.env` file.

<!-- ROADMAP -->

## Roadmap

<!-- CONTRIBUTING -->

## Contributing

<!-- LICENSE -->

## License

See [LICENSE.md](./LICENSE.md)
