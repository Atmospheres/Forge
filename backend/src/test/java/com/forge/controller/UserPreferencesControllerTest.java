package com.forge.controller;

import com.forge.config.TestSecurityConfig;
import com.forge.model.UserPreferences;
import com.forge.repository.UserPreferencesRepository;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserPreferencesController.class)
@Import(TestSecurityConfig.class)
class UserPreferencesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @MockitoBean
    private UserPreferencesRepository preferencesRepository;

    private static final String OWNER_SUB = "auth0|owner-123";

    @Test
    void getPreferences_noneStored_returnsLightDefault() throws Exception {
        when(preferencesRepository.findById(OWNER_SUB)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.theme").value("light"));
    }

    @Test
    void getPreferences_stored_returnsStoredValue() throws Exception {
        when(preferencesRepository.findById(OWNER_SUB))
            .thenReturn(Optional.of(new UserPreferences(OWNER_SUB, "dark")));

        mockMvc.perform(get("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.theme").value("dark"));
    }

    @Test
    void updatePreferences_noneStored_createsNew() throws Exception {
        when(preferencesRepository.findById(OWNER_SUB)).thenReturn(Optional.empty());
        when(preferencesRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new ThemeOnly("dark"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.theme").value("dark"));

        verify(preferencesRepository).save(any());
    }

    @Test
    void updatePreferences_alreadyStored_updatesExistingRow() throws Exception {
        UserPreferences existing = new UserPreferences(OWNER_SUB, "light");
        when(preferencesRepository.findById(OWNER_SUB)).thenReturn(Optional.of(existing));
        when(preferencesRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new ThemeOnly("dark"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.theme").value("dark"));

        verify(preferencesRepository).save(existing);
    }

    @Test
    void updatePreferences_invalidThemeValue_returns400AndDoesNotSave() throws Exception {
        mockMvc.perform(put("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new ThemeOnly("blue"))))
            .andExpect(status().isBadRequest());

        verify(preferencesRepository, never()).save(any());
    }

    @Test
    void updatePreferences_missingTheme_returns400AndDoesNotSave() throws Exception {
        mockMvc.perform(put("/api/me/preferences")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());

        verify(preferencesRepository, never()).save(any());
    }

    private record ThemeOnly(String theme) {}
}
