<?php

// On cPanel, keep the Make URL outside public_html so it cannot be downloaded.
$privateConfigPath = dirname(__DIR__, 2) . '/make-webhook-config.php';
$privateConfig = is_readable($privateConfigPath)
    ? include $privateConfigPath
    : [];
$privateConfig = is_array($privateConfig) ? $privateConfig : [];
$webhookUrl = getenv('MAKE_MARKETING_WEBHOOK_URL') ?: ($privateConfig['url'] ?? '');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

if ($webhookUrl === '') {
    http_response_code(503);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);

if (!is_array($payload)) {
    http_response_code(400);
    exit;
}

$ch = curl_init($webhookUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    exit;
}

http_response_code(204);
