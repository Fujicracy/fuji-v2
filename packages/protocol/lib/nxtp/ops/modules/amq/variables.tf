
variable "stage" {
  description = "stage of deployment"
}

variable "environment" {}

variable "rmq_mgt_password" {
  type        = string
  description = "RabbitMQ management password"
}

variable "rmq_mgt_user" {
  type        = string
  default     = "connext"
  description = "RabbitMQ management user"
}

variable "host_instance_type" {
  type        = string
  description = "The broker's instance type. e.g. mq.t2.micro or mq.m4.large"
  default     = "mq.m5.large"
}

variable "publicly_accessible" {
  type        = bool
  description = "Whether to enable connections from applications outside of the VPC that hosts the broker's subnets"
  default     = false
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC to create the broker in"
}

variable "zone_id" {
  description = "hosted zone id"
}

variable "base_domain" {
  description = "base domain of the application"
  default     = "connext.ninja"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of VPC subnet IDs"
}

variable "sg_id" {
  type        = string
  description = "security group id of worker node sg"
}

variable "deployment_mode" {
  type        = string
  description = "Deployment mode of cluster"
  default     = "CLUSTER_MULTI_AZ"
}
