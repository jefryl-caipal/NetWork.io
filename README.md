# Wi-Fi Authentication Portal

A small PHP and MySQL-backed portal for collecting a visitor's name and device ID, recording their agreement to the network terms, and storing the submitting IP address.

## Files

- `index.html` — authentication form.
- `index.js` — validates the form, requires the terms page to be opened, and submits the form to the server.
- `Terms and Conditions.html` — network terms shown before the visitor can agree.
- `connect.php` — validates submissions and saves them to MySQL.
- `style.css` and `style1.css` — styles for the form and terms page.
- `upgrade-database.sql` — adds acceptance counts, merges duplicate name/device records, and adds a unique key.
- `add-ip-address.sql` — adds the IP address column.
- `fix-ip-address-column.sql` — changes an existing IP address column to support IPv4 and IPv6 addresses.

## Setup

1. Serve this folder from a PHP-enabled web server; do not open `index.html` directly as a local file. PHP must have the PDO MySQL driver and the `mbstring` extension enabled.
2. Create the MySQL database and the initial `users` table. The table must contain `id`, `name`, `device`, and `terms_accepted` columns before applying the upgrade script.
3. Select the `users` database and run `upgrade-database.sql`.
4. Run `add-ip-address.sql` to add the IP address column. If that column already exists but has the wrong type, run `fix-ip-address-column.sql` instead; do not run both.
5. Configure the database connection for PHP using these environment variables:

   - `DB_HOST` — defaults to `127.0.0.1`
   - `DB_NAME` — defaults to `users`
   - `DB_USER` — defaults to `root`
   - `DB_PASS` — defaults to an empty password

6. Visit `index.html` through the web server and submit a test entry.

The database user needs permission to insert and update rows in `users`. The table's unique key on `(name, device)` allows repeat submissions to increment `accept_count` rather than create duplicate records.

## Submission flow

Visitors enter a name and device ID, open the terms page, and check the agreement box. The browser sends the form to `connect.php`, which validates the fields and records the agreement and client IP address. Submission responses are returned as JSON.
