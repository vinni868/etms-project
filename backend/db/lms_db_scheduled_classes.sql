-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: lms_db
-- ------------------------------------------------------
-- Server version	8.0.36

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
-- Table structure for table `scheduled_classes`
--

DROP TABLE IF EXISTS `scheduled_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_id` int NOT NULL,
  `trainer_id` int NOT NULL,
  `class_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('ACTIVE','INACTIVE','COMPLETED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `fk_trainer_user` (`trainer_id`),
  CONSTRAINT `fk_trainer_user` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `scheduled_classes_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_classes`
--

LOCK TABLES `scheduled_classes` WRITE;
/*!40000 ALTER TABLE `scheduled_classes` DISABLE KEYS */;
INSERT INTO `scheduled_classes` VALUES (1,1,1,'2026-03-13','2026-03-31','09:00:00','10:00:00','2026-03-11 07:56:38','2026-03-11 10:28:05','ACTIVE'),(2,2,6,'2026-03-11','2026-03-12','10:30:00','11:30:00','2026-03-11 08:05:50','2026-03-11 08:06:12','ACTIVE'),(3,3,11,'2026-03-11','2026-03-16','09:00:00','10:00:00','2026-03-11 08:14:09','2026-03-11 08:14:09','ACTIVE'),(4,4,1,'2026-03-12','2026-03-19','10:00:00','11:00:00','2026-03-11 08:51:44','2026-03-11 08:51:44','ACTIVE'),(5,5,19,'2026-03-11','2026-03-20','11:30:00','12:30:00','2026-03-11 09:45:29','2026-03-12 05:39:43','ACTIVE'),(6,6,6,'2026-03-13','2026-03-16','09:00:00','10:00:00','2026-03-12 09:44:03','2026-03-12 09:44:18','ACTIVE'),(7,3,11,'2026-03-20','2026-07-11','09:00:00','10:30:00','2026-03-12 09:49:10','2026-03-13 05:27:06','ACTIVE'),(8,7,29,'2026-03-14','2026-03-26','09:00:00','10:00:00','2026-03-13 07:23:20','2026-03-14 06:09:48','ACTIVE');
/*!40000 ALTER TABLE `scheduled_classes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-14 19:10:12
