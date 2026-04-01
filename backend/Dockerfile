# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY . .
RUN chmod +x mvnw
RUN ./mvnw clean install -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/LMS-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT [ \
  "java", \
  "-XX:+UseSerialGC", \
  "-Xmx300m", \
  "-Xss512k", \
  "-XX:MaxRAM=400m", \
  "-XX:TieredStopAtLevel=1", \
  "-noverify", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", \
  "app.jar" \
]
