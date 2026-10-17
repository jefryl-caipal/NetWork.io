USE `users`;

ALTER TABLE `users`
  ADD COLUMN `ip_address` VARCHAR(45) DEFAULT NULL;
