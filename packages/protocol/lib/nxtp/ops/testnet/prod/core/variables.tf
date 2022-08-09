variable "region" {
  default = "us-west-1"
}

variable "cidr_block" {
  default = "172.17.0.0/16"
}

variable "az_count" {
  default = "2"
}

variable "stage" {
  description = "stage of deployment"
  default     = "production"
}

variable "environment" {
  description = "env we're deploying to"
  default     = "testnet"
}

variable "nomad_environment" {
  description = "nomad environment type"
  default     = "staging"
}

variable "domain" {
  default = "core"
}

variable "full_image_name_router_publisher" {
  type        = string
  description = "router image name"
  default     = "ghcr.io/connext/router-publisher:0.2.0-beta.17"
}

variable "full_image_name_router_subscriber" {
  type        = string
  description = "router image name"
  default     = "ghcr.io/connext/router-subscriber:0.2.0-beta.17"
}

variable "full_image_name_sequencer_publisher" {
  type        = string
  description = "sequencer image name"
  default     = "ghcr.io/connext/sequencer-publisher:0.2.0-beta.17"
}

variable "full_image_name_sequencer_subscriber" {
  type        = string
  description = "sequencer image name"
  default     = "ghcr.io/connext/sequencer-subscriber:0.2.0-beta.17"
}

variable "full_image_name_lighthouse" {
  type        = string
  description = "router image name"
  default     = "ghcr.io/connext/lighthouse:0.2.0-beta.17"
}

variable "mnemonic" {
  type        = string
  description = "mnemonic"
  default     = "female autumn drive capable scorpion congress hockey chunk mouse cherry blame trumpet"
}

variable "admin_token_router" {
  type        = string
  description = "admin token"
}

variable "rmq_mgt_password" {
  type        = string
  description = "RabbitMQ management password"
}

variable "rmq_mgt_user" {
  type        = string
  default     = "connext"
  description = "RabbitMQ management user"
}



variable "certificate_arn_testnet" {
  default = "arn:aws:acm:us-west-1:679752396206:certificate/0ebbf095-681a-4a0a-9dc9-fa70cb80166a"
}

variable "rinkeby_alchemy_key_0" {
  type = string
}

variable "kovan_alchemy_key_0" {
  type = string
}

variable "goerli_alchemy_key_0" {
  type = string
}

variable "rinkeby_alchemy_key_1" {
  type = string
}

variable "kovan_alchemy_key_1" {
  type = string
}

variable "goerli_alchemy_key_1" {
  type = string
}

variable "web3_signer_private_key" {
  type = string
}

variable "dd_api_key" {
  type = string
}
