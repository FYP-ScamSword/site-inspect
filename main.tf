provider "aws" {
  region = "ap-southeast-1"
}

# Define the VPC, subnets, and security groups for the ECS tasks
module "ecs_network" {
  source = "terraform-aws-modules/vpc/aws"

  name = "link-inspection-ecs-network"
  cidr = "10.0.0.0/16"

  azs             = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

# Create an ECR repository for each backend service
resource "aws_ecr_repository" "url_inspection_repo" {
  name = "url-inspection"
}

resource "aws_ecr_repository" "content_inspection_repo" {
  name = "content-inspection"
}

# Push Docker images to the ECR repositories
# Use the aws_ecr_authorization_token data source to retrieve an authentication token for the registry
# Use the docker login and docker push commands to authenticate with the registry and push the images
# For example:
# docker build -t my-url-inspection-image .
# aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ECR-REPOSITORY-URL>
# docker tag my-url-inspection-image:latest <ECR-REPOSITORY-URL>:v1.0.0
# docker push <ECR-REPOSITORY-URL>:v1.0.0

# Create an S3 bucket for environment variables
resource "aws_s3_bucket" "env_bucket" {
  bucket = "link-inspector-env-bucket"
}


# Create an S3 object for each backend service .env file
resource "aws_s3_object" "url_inspection_env" {
  bucket = aws_s3_bucket.env_bucket.id
  key    = "url-inspection/.env"
  source = "${path.module}/url-inspection/.env"

  content_type = "text/plain"
}

resource "aws_s3_object" "content_inspection_env" {
  bucket = aws_s3_bucket.env_bucket.id
  key    = "content-inspection/.env"
  source = "${path.module}/content-inspection/.env"

  content_type = "text/plain"
}

# Create an ECS task definition for each backend service
resource "aws_ecs_task_definition" "url_inspection_task" {
  family                   = "url-inspection"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  network_mode             = "awsvpc"
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  requires_compatibilities = ["FARGATE"]
  cpu       = 256
  memory    = 512
  container_definitions    = jsonencode([{
    name      = "url-inspection-container"
    image     = "${aws_ecr_repository.url_inspection_repo.repository_url}:v1.0.0"
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]
    secrets = [{
      name      = ".env"
      valueFrom = aws_ssm_parameter.url_inspection_env.name
    }]
  }])
}

resource "aws_ecs_task_definition" "content_inspection_task" {
  family                   = "content-inspection-task"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  network_mode             = "awsvpc"
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  requires_compatibilities = ["FARGATE"]
  cpu       = 256
  memory    = 512
  container_definitions    = jsonencode([{
    name      = "content-inspection-container"
    image     = "${aws_ecr_repository.content_inspection_repo.repository_url}:v1.0.0"
    portMappings = [{
      containerPort = 5001
      hostPort      = 5001
      protocol      = "tcp"
    }]
    secrets = [{
      name      = ".env"
      valueFrom = aws_ssm_parameter.content_inspection_env.name
    }]
  }])
}

# Create an ECS service for each backend service
resource "aws_ecs_service" "url_inspection_service" {
  name            = "url-inspection-service"
  cluster         = aws_ecs_cluster.link-inspection_cluster.arn
  task_definition = aws_ecs_task_definition.url_inspection_task.arn
  desired_count   = 1

  network_configuration {
    security_groups = [module.ecs_network.default_security_group_id]
    subnets         = module.ecs_network.private_subnets
  }
}

resource "aws_ecs_service" "content_inspection_service" {
  name            = "content-inspection-service"
  cluster         = aws_ecs_cluster.link-inspection_cluster.arn
  task_definition = aws_ecs_task_definition.content_inspection_task.arn
  desired_count   = 1

  network_configuration {
    security_groups = [module.ecs_network.default_security_group_id]
    subnets         = module.ecs_network.private_subnets
  }
}
resource "aws_ecs_cluster" "link-inspection_cluster" {
  name = "link-inspection-cluster"
}
# Create an SSM parameter for each backend service .env file
resource "aws_ssm_parameter" "url_inspection_env" {
  name  = "/url-inspection/.env"
  type  = "SecureString"
  value = aws_s3_object.url_inspection_env.id
}

resource "aws_ssm_parameter" "content_inspection_env" {
  name  = "/content-inspection/.env"
  type  = "SecureString"
  value = aws_s3_object.content_inspection_env.id
}

# Update the security group rules to allow inbound traffic to the container ports for each backend service
resource "aws_security_group_rule" "url_inspection_rule" {
  type        = "ingress"
  from_port   = 8080
  to_port     = 8080
  protocol    = "tcp"
  # cidr_blocks = ["0.0.0.0/0"]
  security_group_id = module.ecs_network.default_security_group_id
  source_security_group_id = module.ecs_network.default_security_group_id
  description = "Allow inbound traffic to the URL inspection container"
}

resource "aws_security_group_rule" "content_inspection_rule" {
  type        = "ingress"
  from_port   = 5001
  to_port     = 5001
  protocol    = "tcp"
  # cidr_blocks = ["0.0.0.0/0"]
  security_group_id = module.ecs_network.default_security_group_id
  source_security_group_id = module.ecs_network.default_security_group_id
  description = "Allow inbound traffic to the content inspection container"
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.ecs_execution_role.name
}

resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerServiceforEC2Role"
#   role       = aws_iam_role.ecs_task_role.name
# }
