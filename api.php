<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$dataFile = 'database.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents($dataFile);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    file_put_contents($dataFile, file_get_contents('php://input'));
    echo '{"success":true}';
}
?>