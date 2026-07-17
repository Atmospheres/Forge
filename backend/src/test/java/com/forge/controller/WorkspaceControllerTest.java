package com.forge.controller;

import com.forge.config.TestSecurityConfig;
import com.forge.model.Workspace;
import com.forge.repository.WorkspaceRepository;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * These tests exist specifically to lock in the ownership-check logic —
 * i.e. that a user can only read/rename/delete workspaces they own, even
 * if they know (or guess) another user's workspace UUID. This is the most
 * security-relevant code in the app, so it's covered even though most of
 * the rest of the backend doesn't have tests yet.
 */
@WebMvcTest(controllers = WorkspaceController.class)
@Import(TestSecurityConfig.class)
class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @MockitoBean
    private WorkspaceRepository workspaceRepository;

    private static final String OWNER_SUB = "auth0|owner-123";
    private static final String OTHER_USER_SUB = "auth0|someone-else";

    @Test
    void getWorkspace_ownedByCaller_returns200() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Personal", OWNER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(get("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isOk());
    }

    @Test
    void getWorkspace_ownedBySomeoneElse_returns404() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Someone Else's Workspace", OTHER_USER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        // Caller authenticates as OWNER_SUB, but the workspace belongs to OTHER_USER_SUB
        mockMvc.perform(get("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNotFound());
    }

    @Test
    void getWorkspace_doesNotExist_returns404() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNotFound());
    }

    @Test
    void renameWorkspace_ownedBySomeoneElse_returns404AndDoesNotSave() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Not Yours", OTHER_USER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(patch("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly("New Name"))))
            .andExpect(status().isNotFound());

        verify(workspaceRepository, never()).save(any());
    }

    @Test
    void deleteWorkspace_ownedBySomeoneElse_returns404AndDoesNotDelete() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Not Yours", OTHER_USER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(delete("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNotFound());

        verify(workspaceRepository, never()).delete(any());
    }

    @Test
    void deleteWorkspace_ownedByCaller_deletesIt() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Mine", OWNER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(delete("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB))))
            .andExpect(status().isNoContent());

        verify(workspaceRepository).delete(workspace);
    }
@Test
    void createWorkspace_blankName_returns400AndDoesNotSave() throws Exception {
        mockMvc.perform(post("/api/workspaces")
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly(""))))
            .andExpect(status().isBadRequest());

        verify(workspaceRepository, never()).save(any());
    }

    @Test
    void renameWorkspace_blankName_returns400AndDoesNotSave() throws Exception {
        UUID workspaceId = UUID.randomUUID();
        Workspace workspace = new Workspace("Mine", OWNER_SUB);
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(workspace));

        mockMvc.perform(patch("/api/workspaces/{id}", workspaceId)
                .with(jwt().jwt(j -> j.tokenValue("test-token").subject(OWNER_SUB)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new NameOnly(""))))
            .andExpect(status().isBadRequest());

        verify(workspaceRepository, never()).save(any());
    }

    // Minimal shape matching WorkspaceDto.UpdateRequest, kept local so this
    // test file doesn't need to depend on the DTO's exact record definition.
    private record NameOnly(String name) {}
}