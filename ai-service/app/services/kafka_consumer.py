import json
import httpx
from aiokafka import AIOKafkaConsumer
from app.core.config import KAFKA_BROKER, BACKEND_URL, JAVA_BACKEND_DIR, get_m2m_headers
from app.services.ai_service import process_job_with_ai, calculate_match_score, generate_skill_gap_feedback
from app.services.resume_parser import extract_text_from_pdf
from app.ml import engine as ml_engine

async def consume_kafka_messages():
    consumer = AIOKafkaConsumer(
        "job-created",
        bootstrap_servers=KAFKA_BROKER,
        group_id='ai_vector_group-v2',
        auto_offset_reset='earliest'
    )
    await consumer.start()
    print("🚀 Kafka Consumer Connected to topic: job-created")
    try:
        async for msg in consumer:
            raw_value = msg.value.decode('utf-8')
            try:
                job_data = json.loads(raw_value)
                if job_data.get("id"):
                    print(f"\n📥 Received Job {job_data.get('id')}. Analyzing Context...")
                    process_job_with_ai(job_data)
            except json.JSONDecodeError:
                print(f"⚠️ SKIPPING POISON PILL (Not JSON): {raw_value}")
    except Exception as e:
        print(f"🚨 FATAL ERROR in Kafka loop: {e}")
    finally:
        await consumer.stop()

async def consume_resume_events():
    consumer = AIOKafkaConsumer(
        "resume-uploaded",
        bootstrap_servers=KAFKA_BROKER,
        group_id='ai-resume-group',
        auto_offset_reset='latest'
    )
    await consumer.start()
    print("🎧 Python AI listening for 'resume-uploaded' events...")
    try:
        async for msg in consumer:
            try:
                event = json.loads(msg.value.decode('utf-8'))
                app_id = event.get("applicationId")
                job_id = event.get("jobId")
                relative_file_path = event.get("resumeUploadedPath")

                print(f"\n📥 Received resume upload Application {app_id}")

                async with httpx.AsyncClient() as client:
                    job_response = await client.get(f"{BACKEND_URL}/api/jobs/{job_id}")
                    if job_response.status_code != 200:
                        continue
                    job_desc = job_response.json().get("description", "")
                
                clean_relative_path = relative_file_path.replace("\\", "/")
                absolute_file_path = f"{JAVA_BACKEND_DIR}/{clean_relative_path}"
                print(f"📂 Reading PDF from: {absolute_file_path}")

                resume_text = extract_text_from_pdf(absolute_file_path)
                match_score = calculate_match_score(resume_text, job_desc)
                skill_gap_feedback, missing_count = generate_skill_gap_feedback(resume_text, job_desc)
                
                final_score = match_score
                
                # Use the ML engine to apply implicit bias rules
                prediction = ml_engine.get_ml_prediction(match_score, missing_count)
                if prediction == -1:
                    print("📉 ML Model predicts Recruiter Rejection (Implicit Bias detected). Penalizing score...")
                    final_score = max(0.0, match_score - 15.0)
                elif prediction == 1:
                    print("📈 ML Model predicts Recruiter Approval. Boosting score...")
                    final_score = min(100.0, match_score + 5.0)
                
                print(f"📊 Final AI Match Score for Application {app_id}: {final_score}%")

                payload = {"aiMatchScore": final_score, "aiSkillGap": skill_gap_feedback}
                async with httpx.AsyncClient() as client:
                    put_response = await client.put(
                        f"{BACKEND_URL}/api/applications/{app_id}/score",
                        json=payload,
                        headers=get_m2m_headers()
                    )
                    if put_response.status_code == 200:
                        print(f"✅ Successfully updated Application {app_id} with score {final_score}%")
                        ml_engine.AI_RESUMES_SCORED.inc()
                    else:
                        print(f"⚠️ Failed to update Java Backend. Status: {put_response.status_code}")
            except Exception as e:
                print(f"🚨 Error processing resume event: {e}")
    finally: 
        await consumer.stop()