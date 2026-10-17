USE `users`;

ALTER TABLE `users`
  MODIFY COLUMN `ip_address` VARCHAR(45) DEFAULT NULL;
