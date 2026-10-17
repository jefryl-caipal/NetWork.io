<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['message' => 'This endpoint only accepts form submissions.']);
}

$name = trim((string) ($_POST['name'] ?? ''));
$device = trim((string) ($_POST['device'] ?? ''));
$termsAccepted = ($_POST['terms'] ?? '') === 'on';
$ipAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? '');

if ($name === '' || mb_strlen($name) > 150 || $device === '' || mb_strlen($device) > 255) {
    respond(422, ['message' => 'Enter a name (up to 150 characters) and device ID (up to 255 characters).']);
}

if ($ipAddress === '' || filter_var($ipAddress, FILTER_VALIDATE_IP) === false) {
    error_log('Submission rejected because the client IP address was unavailable or invalid.');
    respond(500, ['message' => 'The server could not verify the connection address. Please try again later.']);
}

if (!$termsAccepted) {
    respond(422, ['message' => 'You must agree to the Terms and Conditions before submitting.']);
}

$host = getenv('DB_HOST') ?: '127.0.0.1';
$database = getenv('DB_NAME') ?: 'users';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $statement = $pdo->prepare(
        'INSERT INTO users (name, device, terms_accepted, accept_count, ip_address)
         VALUES (:name, :device, :terms_accepted, 1, :ip_address)
         ON DUPLICATE KEY UPDATE
             accept_count = accept_count + 1,
             terms_accepted = 1,
             ip_address = :updated_ip_address'
    );
    $statement->execute([
        ':name' => $name,
        ':device' => $device,
        ':terms_accepted' => 1,
        ':ip_address' => $ipAddress,
        ':updated_ip_address' => $ipAddress,
    ]);
} catch (PDOException $error) {
    error_log('Database submission failed: ' . $error->getMessage());
    respond(500, ['message' => 'The server could not save your details. Check the database setup and try again.']);
}

respond(201, ['message' => 'Thank you. Your agreement was recorded successfully.']);