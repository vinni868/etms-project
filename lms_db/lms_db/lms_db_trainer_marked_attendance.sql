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
-- Table structure for table `trainer_marked_attendance`
--

DROP TABLE IF EXISTS `trainer_marked_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainer_marked_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('PRESENT','ABSENT','LEAVE','LATE') NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_attendance_student` (`student_id`),
  KEY `fk_attendance_batch` (`batch_id`),
  CONSTRAINT `fk_attendance_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainer_marked_attendance`
--

LOCK TABLES `trainer_marked_attendance` WRITE;
/*!40000 ALTER TABLE `trainer_marked_attendance` DISABLE KEYS */;
INSERT INTO `trainer_marked_attendance` VALUES (1,12,1,'2026-03-12','PRESENT','HTML','2026-03-12 11:34:08'),(2,20,1,'2026-03-12','PRESENT','HTML','2026-03-12 11:34:08'),(3,15,4,'2026-03-12','PRESENT','Syntax','2026-03-12 11:34:29'),(4,28,4,'2026-03-12','PRESENT','Syntax','2026-03-12 11:34:29'),(5,12,1,'2026-03-11','PRESENT','HTML intro','2026-03-12 16:33:10'),(6,20,1,'2026-03-11','LATE','HTML intro','2026-03-12 16:33:10'),(7,15,4,'2026-03-11','PRESENT','Python 2','2026-03-12 16:33:50'),(8,28,4,'2026-03-11','PRESENT','Python 2','2026-03-12 16:33:50'),(9,12,2,'2026-03-12','PRESENT','SQL intro','2026-03-12 16:34:52'),(10,28,2,'2026-03-12','PRESENT','SQL intro','2026-03-12 16:34:52'),(11,12,6,'2026-03-12','PRESENT','AI intro','2026-03-12 16:35:24'),(12,28,7,'2026-03-12','PRESENT','CLoud','2026-03-13 05:28:32'),(13,20,7,'2026-03-12','PRESENT','CLoud','2026-03-13 05:28:32'),(14,28,7,'2026-03-13','ABSENT','CLoud intro','2026-03-13 11:39:01'),(15,20,7,'2026-03-13','PRESENT','CLoud intro','2026-03-13 11:39:02'),(16,12,1,'2026-03-13','PRESENT','WEB','2026-03-13 12:42:55'),(17,20,1,'2026-03-13','PRESENT','WEB','2026-03-13 12:42:55'),(18,15,4,'2026-03-14','LATE','WEB','2026-03-14 06:42:41'),(19,28,4,'2026-03-14','PRESENT','WEB','2026-03-14 06:42:41');
/*!40000 ALTER TABLE `trainer_marked_attendance` ENABLE KEYS */;
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
