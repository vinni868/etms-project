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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `status` enum('ACTIVE','PENDING','REJECTED','INACTIVE') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'SHIVARAMU','shivaram@gmail.com','9880949131','1234564',3,'ACTIVE','2026-02-17 11:09:19'),(2,'Kavya S','kavya@gmail.com','8787979876','1234',4,'ACTIVE','2026-02-17 11:10:48'),(3,'admin','admin@gmail.com','9876483948','123',2,'ACTIVE','2026-02-17 11:10:48'),(4,'Kavya S','kavya1@gmail.com','8787979876','1234',4,'ACTIVE','2026-02-18 10:37:55'),(5,'Kavya S','kavyas@gmail.com','8787979876','123',4,'ACTIVE','2026-02-18 11:10:02'),(6,'vinayaka','vinayaka@gmail.com','9497487864','123456',3,'ACTIVE','2026-02-18 11:35:26'),(7,'superadmin','superadmin@gmail.com','9880885848','123',1,'ACTIVE','2026-02-18 11:35:26'),(8,'Admin','admin1@gmail.com',NULL,'123',2,'ACTIVE','2026-02-20 11:58:03'),(9,'Admin','admin2@gmail.com',NULL,'123',2,'ACTIVE','2026-02-20 12:04:13'),(10,'kaveri','kaveri@gmail.com','9497487864','123',4,'ACTIVE','2026-02-20 12:08:38'),(11,'manju','manju@gmail.com','8976554342','123567',3,'ACTIVE','2026-02-20 12:23:16'),(12,'shiva','shiva01@gmail.com','7686767889','123',4,'ACTIVE','2026-02-23 09:34:12'),(13,'heshika','heshika@gmail.com','8596809586','123',3,'ACTIVE','2026-02-23 14:12:42'),(14,'heshu','heshu@gmail.com','8975878578','1234',3,'ACTIVE','2026-02-24 05:09:00'),(15,'ammu','ammu@gmail.com','9604984975','123',4,'ACTIVE','2026-02-24 10:21:50'),(17,'yashu','yashu@gmail.com','9889897777','123445',3,'ACTIVE','2026-02-24 13:46:02'),(18,'bhuvan','bhuvan@gmail.com','8088154559','123456',3,'ACTIVE','2026-02-24 13:55:30'),(19,'revamma','revamma@gmail.com','6364354908','123456',3,'ACTIVE','2026-02-24 14:18:23'),(20,'hello','hello@gmail.com','7587685678','123445786',4,'ACTIVE','2026-02-25 06:21:04'),(21,'harshitha','harshitha@gmail.com','9899945979','1234566',3,'ACTIVE','2026-02-25 06:30:12'),(22,'anjaneya','anju_01@gmail.com','8984933832','988094',3,'ACTIVE','2026-03-07 09:48:35'),(23,'balaji','balaji@gmail.com','8968796576','12345',4,'REJECTED','2026-03-09 14:16:33'),(24,'gayathri','gayathri@gmail.com','9685768768','123',4,'PENDING','2026-03-09 14:50:34'),(25,'sidappa','sidappa@gmail.com','9569476967','123',4,'PENDING','2026-03-09 15:10:20'),(26,'veena','veena@gmail.com','8667767573','123',4,'PENDING','2026-03-09 15:11:03'),(27,'basamma','basamma@gmail.com','9689689688','123',4,'PENDING','2026-03-09 15:11:28'),(28,'Ravi ','ravi@gmail.com','8968905589','123456',4,'ACTIVE','2026-03-12 05:26:54'),(29,'Ravi Kumar','ravukumar@gmail.com','9583475834','123456',3,'ACTIVE','2026-03-12 05:31:03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-14 19:10:11
