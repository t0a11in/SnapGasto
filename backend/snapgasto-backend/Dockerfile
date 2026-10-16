# Compila la API y genera una imagen de ejecución con el mismo Java del proyecto.
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /workspace

COPY pom.xml ./
RUN mvn --batch-mode dependency:go-offline

COPY src ./src
RUN mvn --batch-mode --no-transfer-progress -DskipTests package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=builder /workspace/target/snapgasto-backend-*.jar /app/app.jar
RUN groupadd --system snapgasto && useradd --system --gid snapgasto snapgasto \
    && chown snapgasto:snapgasto /app/app.jar

USER snapgasto
EXPOSE 8080 5005
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
