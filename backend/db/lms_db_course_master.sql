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
-- Table structure for table `course_master`
--

DROP TABLE IF EXISTS `course_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_name` varchar(150) NOT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `description` text,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `syllabus_file_name` varchar(255) DEFAULT NULL,
  `syllabus_file_path` varchar(500) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_name` (`course_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_master`
--

LOCK TABLES `course_master` WRITE;
/*!40000 ALTER TABLE `course_master` DISABLE KEYS */;
INSERT INTO `course_master` VALUES (1,'JAVA FULL STACK','6 Months','Java Full Stack Development is a comprehensive course that teaches students to build complete web applications using Java technologies. It covers frontend development with HTML, CSS, JavaScript, and React, backend development with Spring Boot, database management with MySQL, REST API development, security, version control, and deployment for real-world software projects','ACTIVE','JAVA FULL STACK.pdf','C:\\Users\\KAVYA S\\Downloads\\LMS-Backend/uploads/syllabus/1772790332512_JAVA FULL STACK.pdf',1),(2,'Python Full Stack','6 Months','Python Full Stack Development course teaches you how to build complete web applications from start to finish. You will learn Python programming, backend development using frameworks like Django or Flask, and frontend technologies such as HTML, CSS, and JavaScript. The course covers database management, REST APIs, version control with Git, and deployment of applications to the cloud. Through hands-on projects and real-world examples, you will gain practical experience in designing, developing','ACTIVE','python_full_stack_syllabus.pdf','C:\\Users\\KAVYA S\\Downloads\\LMS-Backend/uploads/syllabus/1772877615159_python_full_stack_syllabus.pdf',1),(3,'AI&ML','6 Months','Artificial Intelligence and Machine Learning (AI & ML) is a course that introduces students to the concepts and techniques used to build intelligent systems that can learn from data and make decisions. The course covers fundamental topics such as data preprocessing, supervised and unsupervised learning, neural networks, deep learning, and model evaluation. Students learn how to use programming tools and libraries to develop machine learning models and apply them to real-world problems','ACTIVE','signed_agreement_1.pdf','C:\\Users\\KAVYA S\\Downloads\\LMS-Backend/uploads/syllabus/1773145602691_1770030382107_signed_agreement_1.pdf',1),(4,'Cloud Computing','3 Months','Cloud Computing is a comprehensive course that teaches students how to design, deploy, and manage applications and infrastructure using cloud technologies. It covers the fundamentals of cloud services, virtualization, and distributed systems. Students will learn about major cloud platforms such as Amazon Web Services, Microsoft Azure, and Google Cloud Platform. The course includes topics like cloud architecture, storage and networking services, virtual machines, containerization using Docker.','ACTIVE','1773222726829_JAVA FULL STACK (1).pdf','C:\\Users\\KAVYA S\\Downloads\\LMS-Backend/uploads/syllabus/1773222726829_JAVA FULL STACK (1).pdf',1),(5,'Data Analytics','1 Year','Data analyse','ACTIVE','1773224149762_1770030382107_signed_agreement_1 (1).pdf','C:\\Users\\KAVYA S\\Downloads\\LMS-Backend/uploads/syllabus/1773224149762_1770030382107_signed_agreement_1 (1).pdf',1);
/*!40000 ALTER TABLE `course_master` ENABLE KEYS */;
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
