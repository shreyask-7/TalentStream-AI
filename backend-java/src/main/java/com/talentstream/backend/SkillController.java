package com.talentstream.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    @Autowired
    private SkillRepository skillRepository;

    @GetMapping
    public ResponseEntity<List<String>> getAllSkills() {
        List<String> skills = skillRepository.findAll().stream()
                .map(Skill::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(skills);
    }

    @PostMapping
    public ResponseEntity<?> addSkill(@RequestBody String skillName) {
        if(skillRepository.findByNameIgnoreCase(skillName).isEmpty()) {
            skillRepository.save(new Skill(skillName));
            return ResponseEntity.ok("Skill added");
        }
        return ResponseEntity.badRequest().body("Skill already exists");
    }
}