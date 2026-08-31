<?php

$webhookUrl = getenv('MAKE_MARKETING_WEBHOOK_URL') ?: '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

if ($webhookUrl === '') {
    http_response_code(204);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    $payload = [];
}

$forwardedPayload = array_merge(
    $payload,
    isset($payload['flat']) && is_array($payload['flat']) ? $payload['flat'] : [],
    isset($payload['properties']) && is_array($payload['properties']) ? $payload['properties'] : [],
    isset($payload['user']) && is_array($payload['user']) ? $payload['user'] : []
);

$ch = curl_init($webhookUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($forwardedPayload),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
]);
curl_exec($ch);
curl_close($ch);

http_response_code(204);
