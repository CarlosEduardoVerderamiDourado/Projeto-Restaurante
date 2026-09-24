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
-- Table structure for table `chamados_atendimento`
--

DROP TABLE IF EXISTS `chamados_atendimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chamados_atendimento` (
  `id_chamado` int(11) NOT NULL AUTO_INCREMENT,
  `id_mesa` int(11) NOT NULL,
  `status_chamado` varchar(50) NOT NULL DEFAULT 'Pendente',
  `horario_chamado` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_funcionario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_chamado`),
  KEY `id_mesa` (`id_mesa`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `chamados_atendimento_ibfk_1` FOREIGN KEY (`id_mesa`) REFERENCES `mesas` (`id_mesa`),
  CONSTRAINT `chamados_atendimento_ibfk_2` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chamados_atendimento`
--

LOCK TABLES `chamados_atendimento` WRITE;
/*!40000 ALTER TABLE `chamados_atendimento` DISABLE KEYS */;
INSERT INTO `chamados_atendimento` VALUES (4,1,'A caminho','2026-09-03 19:14:17',1),(5,1,'A caminho','2026-09-21 18:37:05',1),(6,1,'A caminho','2026-09-21 19:13:39',1),(7,1,'A caminho','2026-09-21 19:16:53',1),(8,1,'A caminho','2026-09-21 19:22:27',1),(9,1,'A caminho','2026-09-21 20:47:51',1),(10,1,'A caminho','2026-09-21 20:48:18',1),(11,1,'A caminho','2026-09-21 20:49:43',1),(12,1,'A caminho','2026-09-21 20:50:30',1),(13,1,'A caminho','2026-09-21 20:56:13',1),(14,1,'A caminho','2026-09-21 21:52:01',NULL),(15,1,'A caminho','2026-09-21 22:14:29',NULL),(16,1,'A caminho','2026-09-21 22:15:43',NULL),(17,1,'A caminho','2026-09-21 22:16:47',NULL),(18,1,'A caminho','2026-09-21 22:27:32',NULL),(19,1,'A caminho','2026-09-21 22:31:03',NULL),(20,1,'A caminho','2026-09-21 22:34:28',NULL),(21,1,'A caminho','2026-09-21 22:36:24',NULL),(22,1,'A caminho','2026-09-21 22:36:32',NULL),(23,1,'A caminho','2026-09-21 22:42:15',NULL),(24,1,'A caminho','2026-09-21 22:45:58',NULL),(25,1,'A caminho','2026-09-21 22:46:10',NULL),(26,1,'A caminho','2026-09-21 22:46:16',NULL),(27,1,'A caminho','2026-09-21 22:48:26',NULL),(28,1,'A caminho','2026-09-21 22:48:48',NULL),(29,1,'A caminho','2026-09-21 22:53:21',NULL),(30,1,'A caminho','2026-09-21 22:57:13',NULL),(31,1,'A caminho','2026-09-21 22:58:53',NULL),(32,1,'A caminho','2026-09-21 23:01:09',NULL),(33,1,'A caminho','2026-09-21 23:02:23',NULL),(34,1,'A caminho','2026-09-21 23:03:37',NULL),(35,1,'A caminho','2026-09-21 23:05:37',NULL),(36,1,'A caminho','2026-09-21 23:07:06',NULL),(37,1,'A caminho','2026-09-21 23:23:43',1),(38,1,'A caminho','2026-09-21 23:24:15',1),(39,1,'A caminho','2026-09-23 18:19:29',1),(40,1,'A caminho','2026-09-23 18:20:02',1),(41,1,'A caminho','2026-09-23 18:55:26',1),(42,1,'A caminho','2026-09-23 19:19:05',1);
/*!40000 ALTER TABLE `chamados_atendimento` ENABLE KEYS */;
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
