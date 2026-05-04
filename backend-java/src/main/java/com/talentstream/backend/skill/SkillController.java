package com.talentstream.backend.skill;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    public ResponseEntity<List<String>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    @PreAuthorize("hasAnyRole('RECRUITER', 'SYSTEM')")
    @PostMapping
    public ResponseEntity<?> addSkill(@RequestBody String skillName) {
        boolean isAdded = skillService.addSkill(skillName);

        if(isAdded) {
            return ResponseEntity.ok("Skill added");
        }
        return ResponseEntity.badRequest().body("Skill already exists");
    }
}