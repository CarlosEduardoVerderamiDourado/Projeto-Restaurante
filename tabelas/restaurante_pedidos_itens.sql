-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: restaurante
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pedidos_itens`
--

DROP TABLE IF EXISTS `pedidos_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos_itens` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_comanda` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `preco_unitario_pago` decimal(10,2) NOT NULL,
  `status_preparo` varchar(45) NOT NULL DEFAULT 'Na Fila',
  `horario_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_pedido`),
  KEY `fk_pedidos_comandas` (`id_comanda`),
  KEY `fk_pedidos_produtos` (`id_produto`),
  CONSTRAINT `fk_pedidos_comandas` FOREIGN KEY (`id_comanda`) REFERENCES `comandas` (`id_comanda`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pedidos_produtos` FOREIGN KEY (`id_produto`) REFERENCES `cardapio` (`id_item`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos_itens`
--

LOCK TABLES `pedidos_itens` WRITE;
/*!40000 ALTER TABLE `pedidos_itens` DISABLE KEYS */;
INSERT INTO `pedidos_itens` VALUES (1,3,2,3,39.90,'Entregue','2026-09-21 21:48:11'),(2,3,1,3,28.90,'Entregue','2026-09-21 21:51:39'),(3,3,1,3,28.90,'Entregue','2026-09-21 22:10:07'),(4,3,2,1,39.90,'Entregue','2026-09-21 22:11:46'),(5,3,3,1,26.50,'Entregue','2026-09-21 22:11:46'),(6,3,4,1,6.00,'Entregue','2026-09-21 22:11:46'),(7,3,5,1,8.50,'Entregue','2026-09-21 22:11:46'),(8,3,6,1,14.00,'Entregue','2026-09-21 22:11:46'),(9,3,3,1,26.50,'Entregue','2026-09-21 22:14:05'),(10,3,3,4,26.50,'Entregue','2026-09-23 19:55:58'),(11,3,1,2,28.90,'Entregue','2026-09-23 20:27:55'),(12,3,4,2,6.00,'Entregue','2026-09-23 22:38:47');
/*!40000 ALTER TABLE `pedidos_itens` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-23 22:00:05
