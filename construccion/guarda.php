<?php
// Get raw POST data
$json = file_get_contents('php://input');

// Try to decode JSON to validate
$data = json_decode($json, true);

if (json_last_error() === JSON_ERROR_NONE) {
    // Pretty print the JSON and save to disk
    $pretty = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents('eventos.json', $pretty);

    // Respond with success
    echo json_encode(['status' => 'success', 'message' => 'Data saved to data.json']);
} else {
    // Invalid JSON, respond with error
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
}
?>