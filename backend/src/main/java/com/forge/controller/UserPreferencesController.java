package com.forge.controller;

import com.forge.dto.UserPreferencesDto;
import com.forge.model.UserPreferences;
import com.forge.repository.UserPreferencesRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/preferences")
public class UserPreferencesController {

    private final UserPreferencesRepository preferencesRepository;

    public UserPreferencesController(UserPreferencesRepository preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
    }

    @GetMapping
    public UserPreferencesDto.Response getPreferences(@AuthenticationPrincipal Jwt jwt) {
        return preferencesRepository.findById(jwt.getSubject())
            .map(UserPreferencesDto.Response::from)
            .orElseGet(UserPreferencesDto.Response::defaultValue);
    }

    @PutMapping
    public UserPreferencesDto.Response updatePreferences(
        @Valid @RequestBody UserPreferencesDto.UpdateRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UserPreferences preferences = preferencesRepository.findById(jwt.getSubject())
            .orElseGet(() -> new UserPreferences(jwt.getSubject(), request.theme()));
        preferences.setTheme(request.theme());
        return UserPreferencesDto.Response.from(preferencesRepository.save(preferences));
    }
}
