output "dns_name" {
  value = aws_alb.lb.dns_name
}

output "service_endpoint" {
  value = aws_route53_record.www.name
}
