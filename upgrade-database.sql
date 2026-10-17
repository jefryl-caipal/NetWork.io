-- Active: 1791938996240@@127.0.0.1@3306@users
USE `users`;

ALTER TABLE `users`
  ADD COLUMN `accept_count` BIGINT UNSIGNED NOT NULL DEFAULT 1;

CREATE TEMPORARY TABLE `_users_acceptance_merge` AS
SELECT
  MIN(`id`) AS `keep_id`,
  `name`,
  `device`,
  SUM(`accept_count`) AS `accept_count`,
  MAX(`terms_accepted`) AS `terms_accepted`
FROM `users`
GROUP BY `name`, `device`;

UPDATE `users` AS `existing`
JOIN `_users_acceptance_merge` AS `merged`
  ON `existing`.`id` = `merged`.`keep_id`
SET
  `existing`.`accept_count` = `merged`.`accept_count`,
  `existing`.`terms_accepted` = `merged`.`terms_accepted`;

DELETE `existing`
FROM `users` AS `existing`
JOIN `_users_acceptance_merge` AS `merged`
  ON `existing`.`name` = `merged`.`name`
  AND `existing`.`device` = `merged`.`device`
WHERE `existing`.`id` <> `merged`.`keep_id`;

DROP TEMPORARY TABLE `_users_acceptance_merge`;

ALTER TABLE `users`
  ADD UNIQUE KEY `unique_name_device` (`name`, `device`);
