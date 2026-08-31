<?php
$server = "localhost";
$user = "root";
$senha = "";
$bdname = "restaurante";

try {
    $pdo = new PDO("mysql:host=$server;dbname=$bdname;charset=utf8", $user, $senha);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erro de conexão: " . $e->getMessage());
}
?>