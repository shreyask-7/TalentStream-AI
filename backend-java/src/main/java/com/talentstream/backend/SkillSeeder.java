package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class SkillSeeder implements CommandLineRunner {
    @Autowired
    private SkillRepository skillRepository;

    @Override
    public void run(String... args) throws Exception {
        if(skillRepository.count() == 0) {
            List<String> baseSkills = List.of(
                    // Programming Languages
                    "Python","Java","C","C++","C#","JavaScript","TypeScript","Go","Rust","Kotlin","Swift","Dart","Ruby","PHP","Scala","R","MATLAB",
                    // Frontend
                    "HTML","CSS","Sass","Tailwind CSS","Bootstrap","React","Next.js","Angular","Vue.js","Svelte","Redux","Zustand","Web Accessibility","Responsive Design",
                    // Backend
                    "Spring Boot","Node.js","Express.js","Django","Flask","FastAPI","Ruby on Rails",".NET Core","Hibernate","JPA","GraphQL","REST APIs","gRPC",
                    // Databases
                    "SQL","PostgreSQL","MySQL","SQLite","MongoDB","Cassandra","DynamoDB","Redis","Neo4j","CockroachDB","Supabase","Firebase",
                    // DevOps & Cloud
                    "Docker","Kubernetes","Helm","Terraform","Ansible","CI/CD","GitHub Actions","Jenkins","CircleCI",
                    "AWS","Azure","Google Cloud Platform","CloudFormation","Serverless","Lambda","Cloud Run",
                    // Data & AI
                    "Machine Learning","Deep Learning","Data Analysis","Data Science","NLP","Computer Vision",
                    "Pandas","NumPy","Scikit-learn","TensorFlow","PyTorch","XGBoost","LightGBM",
                    "Data Visualization","Power BI","Tableau","Feature Engineering","MLOps",
                    // Big Data
                    "Apache Spark","Hadoop","Kafka","Flink","Airflow","Databricks","Snowflake","Redshift","BigQuery",
                    // Mobile
                    "Android Development","iOS Development","React Native","Flutter","SwiftUI","Jetpack Compose",
                    // Testing
                    "JUnit","Mockito","Selenium","Cypress","Playwright","TestNG","Jest","Mocha","Chai","Postman","API Testing",
                    // System & Architecture
                    "System Design","Microservices","Event-Driven Architecture","Domain-Driven Design",
                    "Design Patterns","Scalability","High Availability","Distributed Systems","API Gateway",
                    // Security
                    "OAuth","JWT","Authentication","Authorization","OWASP","Penetration Testing","Encryption","Network Security",
                    // OS & Tools
                    "Linux","Unix","Bash","Shell Scripting","Git","GitLab","Bitbucket","Vim","VS Code","IntelliJ IDEA",
                    // Observability
                    "Prometheus","Grafana","ELK Stack","Elasticsearch","Logstash","Kibana","OpenTelemetry","New Relic","Datadog",
                    // Blockchain / Emerging
                    "Blockchain","Solidity","Web3","Smart Contracts","Ethereum","IPFS",
                    // Game Dev
                    "Unity","Unreal Engine","Game Physics","3D Modeling",
                    // Soft Skills (important for matching!)
                    "Problem Solving","Communication","Leadership","Teamwork","Critical Thinking","Time Management","Adaptability",
                    // Methodologies
                    "Agile","Scrum","Kanban","Lean","Waterfall"
            );
            baseSkills.forEach(skill -> skillRepository.save(new Skill(skill)));
            System.out.println("✅ Seeded 50+ baseline skills into PostgreSQL!");
        }
    }
}
