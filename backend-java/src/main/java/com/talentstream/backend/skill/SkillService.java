package com.talentstream.backend.skill;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    public List<String> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(Skill::getName)
                .collect(Collectors.toList());
    }

    public boolean addSkill(String skillName) {
        String cleanName = skillName.replaceAll("\"", "").trim();

        if(skillRepository.findByNameIgnoreCase(cleanName).isEmpty()) {
            skillRepository.save(new Skill(cleanName));
            return true;
        }
        return false;
    }
}