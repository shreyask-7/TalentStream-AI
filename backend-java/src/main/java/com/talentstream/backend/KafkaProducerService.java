package com.talentstream.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topic.job-created}")
    private String topicName;

    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public void sendJobEvent(Object message) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);

            kafkaTemplate.send("job-created", jsonMessage);

            System.out.println("Sent JSON event to Kafka: " + jsonMessage);
        } catch (Exception e) {
            System.err.println("❌ Failed to serialize Kafka message: " + e.getMessage());
        }
    }
}
